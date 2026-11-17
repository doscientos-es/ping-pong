import { describe, expect, it } from 'vitest'
import { clubFixture } from '../../../test/club-fixture'
import { createClubService } from '../../club/application/club-service'
import { createLocalRepository, DATABASE_KEY } from '../../club/infrastructure/local-repository'

// All credentials in this file are generated fictional test data, never real accounts.
const accountInput = () => ({
  name: 'Cuenta de prueba',
  email: 'cuenta@doscientos.example',
  phone: '',
})
const password = () => crypto.randomUUID()

describe('cuentas locales con hash real', () => {
  it('invita con rol, no persiste contraseñas y exige cambiarlas tras entrar', async () => {
    const { gateway, repository } = clubFixture()
    const temporary = password()
    const account = await gateway.inviteUser('admin', {
      ...accountInput(),
      role: 'member',
      temporaryPassword: temporary,
    })
    expect(localStorage.getItem(DATABASE_KEY)?.includes(temporary)).toBe(false)
    expect((await repository.read()).credentials[0].password.digest).toMatch(/^[a-f0-9]{64}$/)
    expect((await gateway.profiles()).find((item) => item.id === account.id)).toMatchObject({
      passwordRequired: true,
      mustChangePassword: true,
    })
    await expect(gateway.login(account.id)).rejects.toThrow()
    const initial = await gateway.login(account.id, temporary)
    const next = password()
    const result = await gateway.changePassword(account.id, temporary, next)
    expect(await gateway.sessionValid(initial)).toBe(false)
    expect(await gateway.sessionValid(result.session)).toBe(true)
    await expect(gateway.login(account.id, temporary)).rejects.toThrow()
    await expect(gateway.login(account.id, next)).resolves.toMatchObject({ memberId: account.id })
    expect(
      (await gateway.profiles()).find((item) => item.id === account.id)?.mustChangePassword,
    ).toBe(false)
    const view = await gateway.view('admin')
    expect('credentials' in view).toBe(false)
    expect((await gateway.profiles()).some((item) => 'password' in item)).toBe(false)
  })
  it('recupera con código de un solo uso y revoca las sesiones previas', async () => {
    const { gateway } = clubFixture()
    const created = await gateway.signup(accountInput(), password())
    const next = password()
    await expect(gateway.recoverPassword(created.member.email, password(), next)).rejects.toThrow()
    await gateway.recoverPassword(created.member.email, created.recoveryCode, next)
    expect(await gateway.sessionValid(created.session)).toBe(false)
    await expect(
      gateway.recoverPassword(created.member.email, created.recoveryCode, password()),
    ).rejects.toThrow()
    await expect(gateway.login(created.member.id, next)).resolves.toMatchObject({
      memberId: created.member.id,
    })
  })
  it('rechaza códigos caducados y carreras que intentan consumir un código dos veces', async () => {
    const { gateway, repository, now } = clubFixture()
    const created = await gateway.signup(accountInput(), password())
    const expired = createClubService(repository, () => new Date(now.getTime() + 366 * 86400000))
    await expect(
      expired.recoverPassword(created.member.email, created.recoveryCode, password()),
    ).rejects.toThrow()
    const attempts = await Promise.allSettled([
      gateway.recoverPassword(created.member.email, created.recoveryCode, password()),
      gateway.recoverPassword(created.member.email, created.recoveryCode, password()),
    ])
    expect(attempts.filter((item) => item.status === 'fulfilled')).toHaveLength(1)
  })
  it('conserva cuentas tras reabrir, aplica roles y bloquea cuentas dadas de baja', async () => {
    const { gateway } = clubFixture()
    const temporary = password()
    const input = { ...accountInput(), role: 'admin' as const, temporaryPassword: temporary }
    await expect(gateway.inviteUser('alba', input)).rejects.toThrow()
    const account = await gateway.inviteUser('admin', input)
    const reopened = createClubService(createLocalRepository(localStorage))
    await expect(reopened.login(account.id, temporary)).resolves.toMatchObject({
      memberId: account.id,
    })
    await gateway.setMemberRole('admin', account.id, 'member')
    await expect(gateway.saveAccountingSettings(account.id, 0, 0)).rejects.toThrow()
    await gateway.setMemberActive('admin', account.id, false)
    await expect(gateway.login(account.id, temporary)).rejects.toThrow('desactivada')
    await expect(gateway.setMemberRole('admin', 'admin', 'member')).rejects.toThrow(
      'al menos un administrador',
    )
  })
  it('permite al administrador restablecer acceso sin conocer la contraseña anterior', async () => {
    const { gateway } = clubFixture()
    const created = await gateway.signup(accountInput(), password())
    await expect(gateway.resetUserPassword('alba', created.member.id, password())).rejects.toThrow()
    const temporary = password()
    await gateway.resetUserPassword('admin', created.member.id, temporary)
    expect(await gateway.sessionValid(created.session)).toBe(false)
    await expect(
      gateway.recoverPassword(created.member.email, created.recoveryCode, password()),
    ).rejects.toThrow()
    await expect(gateway.login(created.member.id, temporary)).resolves.toMatchObject({
      memberId: created.member.id,
    })
  })
  it('rechaza contraseñas cortas y emails duplicados sin altas parciales', async () => {
    const { gateway, repository } = clubFixture()
    const count = (await repository.read()).members.length
    await expect(gateway.signup(accountInput(), 'short')).rejects.toThrow()
    await gateway.signup(accountInput(), password())
    await expect(gateway.signup(accountInput(), password())).rejects.toThrow('Ya existe')
    expect((await repository.read()).members).toHaveLength(count + 1)
    expect((await repository.read()).credentials).toHaveLength(1)
  })
})
