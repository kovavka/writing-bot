import { startNewChain } from '../bot/utils'

describe('startNewChain', () => {
  it('Should set type and index to context', () => {
    const context = {
      from: {
        id: 0,
      },
      session: {
        0: {},
      },
    }
    startNewChain(context as any, 'new_chain')

    expect(context.session[0]).toEqual({
      type: 'new_chain',
      stageIndex: 0,
    })
  })

  it('Should not override existing data', () => {
    const context = {
      from: {
        id: 0,
      },
      session: {
        0: {
          data: 'foo',
        },
      },
    }
    startNewChain(context as any, 'new_chain')

    expect(context.session[0]).toEqual({
      data: 'foo',
      type: 'new_chain',
      stageIndex: 0,
    })
  })
})
