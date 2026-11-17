import { describe, expect, it, vi } from 'vitest'

import { clubFixture } from '../../../test/club-fixture'
import { createLocalRepository, DATABASE_KEY } from './local-repository'
import { createSeed } from './seed'

describe('persistencia local', () => {
  it('crea datos iniciales una sola vez y permite recuperarlos con otro repositorio', async () => {
    const seed = vi.fn(() => createSeed())
    const repository = createLocalRepository(localStorage, seed)
    const initial = await repository.read()
    await repository.read()
    expect(seed).toHaveBeenCalledTimes(1)
    expect(await createLocalRepository(localStorage).read()).toEqual(initial)
  })

  it('no persiste cambios parciales si una operación falla', async () => {
    const { repository, seed } = clubFixture()
    await expect(
      repository.transact((state) => {
        state.members[0].name = 'Cambio que no debe guardarse'
        throw new Error('Fallo de validación')
      }),
    ).rejects.toThrow('validación')
    expect(await repository.read()).toEqual(seed)
  })

  it.each(['{invalid', JSON.stringify({ version: 1 })])(
    'no sobrescribe documentos dañados o incompatibles',
    async (raw) => {
      localStorage.setItem(DATABASE_KEY, raw)
      await expect(createLocalRepository(localStorage).read()).rejects.toThrow()
      expect(localStorage.getItem(DATABASE_KEY)).toBe(raw)
    },
  )

  it('notifica cambios propios y de otras pestañas y permite cancelar la suscripción', async () => {
    const { repository } = clubFixture()
    const listener = vi.fn()
    const unsubscribe = repository.subscribe(listener)
    await repository.transact((state) => {
      state.settings.plans[0].priceCents = 4200
    })
    window.dispatchEvent(new StorageEvent('storage', { key: DATABASE_KEY }))
    window.dispatchEvent(new StorageEvent('storage', { key: 'unrelated' }))
    expect(listener).toHaveBeenCalledTimes(2)
    unsubscribe()
    window.dispatchEvent(new StorageEvent('storage', { key: DATABASE_KEY }))
    expect(listener).toHaveBeenCalledTimes(2)
  })

  it('usa Web Locks cuando están disponibles', async () => {
    const request = vi.fn(async (_name: string, callback: () => unknown) => callback())
    const { repository } = clubFixture()
    const original = Object.getOwnPropertyDescriptor(navigator, 'locks')
    Object.defineProperty(navigator, 'locks', { configurable: true, value: { request } })
    try {
      await repository.transact((state) => {
        state.settings.plans[0].priceCents = 4200
      })
      expect(request).toHaveBeenCalledWith(DATABASE_KEY, expect.any(Function))
      expect((await repository.read()).settings.plans[0].priceCents).toBe(4200)
    } finally {
      if (original) Object.defineProperty(navigator, 'locks', original)
      else Reflect.deleteProperty(navigator, 'locks')
    }
  })

  it('informa del fallo de almacenamiento sin anunciar ni guardar el cambio', async () => {
    const { seed } = clubFixture()
    const listener = vi.fn()
    const storage = {
      getItem: (key: string) => localStorage.getItem(key),
      setItem: () => {
        throw new DOMException('Quota exceeded', 'QuotaExceededError')
      },
    }
    const repository = createLocalRepository(storage)
    const unsubscribe = repository.subscribe(listener)
    await expect(
      repository.transact((state) => {
        state.settings.plans[0].priceCents = 4500
      }),
    ).rejects.toThrow('guardar los cambios')
    expect(listener).not.toHaveBeenCalled()
    expect(await repository.read()).toEqual(seed)
    unsubscribe()
  })

  it('reutiliza una lectura inmutable y detecta el contenido modificado por otro repositorio', async () => {
    const { repository } = clubFixture()
    const first = await repository.read()
    expect(await repository.read()).toBe(first)
    expect(Object.isFrozen(first.members[0])).toBe(true)
    expect(() => {
      first.members[0].name = 'Mutación externa'
    }).toThrow()
    await createLocalRepository(localStorage).transact((state) => {
      state.settings.plans[0].priceCents = 4500
    })
    const updated = await repository.read()
    expect(updated).not.toBe(first)
    expect(updated.settings.plans[0].priceCents).toBe(4500)
    expect(first.settings.plans[0].priceCents).toBe(3900)
    await repository.transact((state) => {
      state.settings.plans[0].priceCents += 100
    })
    expect((await repository.read()).settings.plans[0].priceCents).toBe(4600)
  })

  it('no escribe ni notifica una transacción sin cambios', async () => {
    clubFixture()
    const setItem = vi.fn((key: string, value: string) => localStorage.setItem(key, value))
    const repository = createLocalRepository({
      getItem: (key) => localStorage.getItem(key),
      setItem,
    })
    const initial = await repository.read()
    const listener = vi.fn()
    const unsubscribe = repository.subscribe(listener)
    try {
      await repository.transact((state) => {
        state.settings.plans[0].priceCents = initial.settings.plans[0].priceCents
      })
      expect(setItem).not.toHaveBeenCalled()
      expect(listener).not.toHaveBeenCalled()
      expect(await repository.read()).toBe(initial)
    } finally {
      unsubscribe()
    }
  })

  it('devuelve resultados independientes del snapshot y del documento persistido', async () => {
    const { repository } = clubFixture()
    const member = await repository.transact((state) => {
      state.members[0].name = 'Nombre guardado'
      return state.members[0]
    })
    member.name = 'Mutación del resultado'
    expect((await repository.read()).members[0].name).toBe('Nombre guardado')
    expect((await createLocalRepository(localStorage).read()).members[0].name).toBe(
      'Nombre guardado',
    )
  })

  it('rechaza operaciones asíncronas o resultados no clonables antes de guardar', async () => {
    const { repository } = clubFixture()
    const before = await repository.read()
    await expect(
      repository.transact(async (state) => {
        state.settings.plans[0].priceCents = 4500
      }),
    ).rejects.toThrow('síncronas')
    await expect(
      repository.transact((state) => {
        state.settings.plans[0].priceCents = 4600
        return () => undefined
      }),
    ).rejects.toThrow()
    expect(await repository.read()).toBe(before)
    expect(await createLocalRepository(localStorage).read()).toEqual(before)
  })
})
