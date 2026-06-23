import { useEffect, useMemo, useState, type FormEvent } from 'react'
import type { SystemRecord, TypeOfWorkRecord } from '../../types/domain'

type SystemsWorkspaceProps = {
  canManage: boolean
  loading: boolean
  systems: SystemRecord[]
  typesOfWorks: TypeOfWorkRecord[]
  onCreateSystem: (payload: { name: string }) => Promise<void>
  onUpdateSystem: (systemId: number, payload: { name?: string }) => Promise<void>
  onDeleteSystem: (systemId: number) => Promise<void>
  onCreateTypeOfWork: (payload: { name: string }) => Promise<void>
  onUpdateTypeOfWork: (typeOfWorkId: number, payload: { name?: string }) => Promise<void>
  onDeleteTypeOfWork: (typeOfWorkId: number) => Promise<void>
  onReload: () => void
}

export function SystemsWorkspace({
  canManage,
  loading,
  systems,
  typesOfWorks,
  onCreateSystem,
  onUpdateSystem,
  onDeleteSystem,
  onCreateTypeOfWork,
  onUpdateTypeOfWork,
  onDeleteTypeOfWork,
  onReload,
}: SystemsWorkspaceProps) {
  const [selectedSystemId, setSelectedSystemId] = useState<number | null>(null)
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null)
  const [systemName, setSystemName] = useState('')
  const [typeName, setTypeName] = useState('')

  const selectedSystem = useMemo(
    () => systems.find((item) => item.id === selectedSystemId) ?? null,
    [selectedSystemId, systems]
  )
  const selectedType = useMemo(
    () => typesOfWorks.find((item) => item.id === selectedTypeId) ?? null,
    [selectedTypeId, typesOfWorks]
  )

  useEffect(() => {
    if (!selectedSystemId && systems.length > 0) {
      setSelectedSystemId(systems[0].id)
      setSystemName(systems[0].name)
    }
  }, [systems, selectedSystemId])

  useEffect(() => {
    if (!selectedTypeId && typesOfWorks.length > 0) {
      setSelectedTypeId(typesOfWorks[0].id)
      setTypeName(typesOfWorks[0].name)
    }
  }, [typesOfWorks, selectedTypeId])

  const submitSystem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (selectedSystem) {
      await onUpdateSystem(selectedSystem.id, { name: systemName })
    } else {
      await onCreateSystem({ name: systemName })
    }
    setSystemName('')
  }

  const submitType = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (selectedType) {
      await onUpdateTypeOfWork(selectedType.id, { name: typeName })
    } else {
      await onCreateTypeOfWork({ name: typeName })
    }
    setTypeName('')
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="rounded-[30px] border border-white/10 bg-[#0b0b0c] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.35)] sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-2xl font-semibold text-white">СПЗ и типы работ</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Справочники систем противопожарной защиты и типов обслуживания для карточек объектов и журналов.
            </p>
          </div>
          <button
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            onClick={onReload}
            type="button"
          >
            {loading ? 'Загрузка...' : 'Обновить'}
          </button>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
            <h4 className="text-sm font-semibold text-white">Системы СПЗ</h4>
            <div className="mt-4 grid gap-2">
              {systems.map((item) => (
                <button
                  key={item.id}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                    selectedSystemId === item.id
                      ? 'border-white/20 bg-white/10 text-white'
                      : 'border-white/10 bg-white/[0.02] text-zinc-300 hover:bg-white/[0.05]'
                  }`}
                  onClick={() => {
                    setSelectedSystemId(item.id)
                    setSystemName(item.name)
                  }}
                  type="button"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span>{item.name}</span>
                    <span className="text-xs text-zinc-500">#{item.id}</span>
                  </div>
                  <div className="mt-2 text-xs text-zinc-500">Назначений: {item.addresses.length}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
            <h4 className="text-sm font-semibold text-white">Типы работ</h4>
            <div className="mt-4 grid gap-2">
              {typesOfWorks.map((item) => (
                <button
                  key={item.id}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                    selectedTypeId === item.id
                      ? 'border-white/20 bg-white/10 text-white'
                      : 'border-white/10 bg-white/[0.02] text-zinc-300 hover:bg-white/[0.05]'
                  }`}
                  onClick={() => {
                    setSelectedTypeId(item.id)
                    setTypeName(item.name)
                  }}
                  type="button"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span>{item.name}</span>
                    <span className="text-xs text-zinc-500">#{item.id}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[30px] border border-white/10 bg-[#0b0b0c] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.35)] sm:p-8">
        <h3 className="text-2xl font-semibold text-white">Управление справочником</h3>
        <p className="mt-2 text-sm leading-6 text-zinc-500">
          {canManage ? 'Создание, редактирование и удаление доступны для администратора и куратора.' : 'Режим только для просмотра.'}
        </p>

        <form className="mt-6 grid gap-4" onSubmit={submitSystem}>
          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
            <p className="text-sm font-medium text-white">Система СПЗ</p>
            <label className="mt-4 grid gap-2 text-sm text-zinc-300">
              <span>Название</span>
              <input
                className="h-12 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-white/30 focus:bg-white/[0.07]"
                onChange={(event) => setSystemName(event.target.value)}
                placeholder="Введите название системы"
                value={systemName}
              />
            </label>
            {canManage && (
              <div className="mt-4 flex gap-2">
                <button className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-zinc-200">
                  {selectedSystem ? 'Сохранить' : 'Добавить'}
                </button>
                {selectedSystem && (
                  <button
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
                    onClick={async () => {
                      await onDeleteSystem(selectedSystem.id)
                      setSelectedSystemId(null)
                      setSystemName('')
                    }}
                    type="button"
                  >
                    Удалить
                  </button>
                )}
              </div>
            )}
          </div>
        </form>

        <form className="mt-4 grid gap-4" onSubmit={submitType}>
          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
            <p className="text-sm font-medium text-white">Тип работы</p>
            <label className="mt-4 grid gap-2 text-sm text-zinc-300">
              <span>Название</span>
              <input
                className="h-12 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-white/30 focus:bg-white/[0.07]"
                onChange={(event) => setTypeName(event.target.value)}
                placeholder="Введите тип работ"
                value={typeName}
              />
            </label>
            {canManage && (
              <div className="mt-4 flex gap-2">
                <button className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-zinc-200">
                  {selectedType ? 'Сохранить' : 'Добавить'}
                </button>
                {selectedType && (
                  <button
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
                    onClick={async () => {
                      await onDeleteTypeOfWork(selectedType.id)
                      setSelectedTypeId(null)
                      setTypeName('')
                    }}
                    type="button"
                  >
                    Удалить
                  </button>
                )}
              </div>
            )}
          </div>
        </form>
      </div>
    </section>
  )
}
