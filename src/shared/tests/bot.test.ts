import { WritingBot } from '../bot/bot'
import { Context, Telegraf } from 'telegraf'
import { Update } from 'telegraf/typings/core/types/typegram'

export const errors = {
  unknownCommand: 'unknownCommand',
  stringInvalid: 'stringInvalid',
  numberInvalid: 'numberInvalid',
  generic: 'generic',
}

process.env.ADMIN_ID = 'adminID'

describe('WritingBot', () => {
  const replyMock = jest.fn()
  const sendMessageMock = jest.fn()
  let context: any
  let telegraphBot: Telegraf<Context<Update>>
  let writingBot: WritingBot<string, string>

  beforeEach(() => {
    context = {
      from: {
        id: 0,
      },
      reply: replyMock,
      has: () => true,
      answerCbQuery: jest.fn(),
    } as any

    telegraphBot = {
      context: context,
      use: jest.fn(),
      telegram: { sendMessage: sendMessageMock },
    } as any

    writingBot = new WritingBot(telegraphBot, errors)
  })

  describe('start command', () => {
    it('should execute start handler', async () => {
      const handler = jest.fn()
      await writingBot.startCallback(context, handler)

      expect(handler).toHaveBeenCalled()
    })

    it('should clear session if has any data', async () => {
      context.session = {
        0: {
          data: 'foo',
        },
      }
      await writingBot.startCallback(context, jest.fn())

      expect(context.session[0]).toEqual({})
    })

    it('should send a message to admin if error occurred', async () => {
      await writingBot.startCallback(context, () => {
        throw new Error('some error')
      })

      expect(replyMock).toHaveBeenCalledWith(errors.generic)
      expect(sendMessageMock).toHaveBeenCalledWith(
        'adminID',
        'Something went wrong. Error: some error'
      )
    })
  })

  describe('commands', () => {
    it('should execute command handler', async () => {
      const handler = jest.fn()
      await writingBot.commandCallback(context, handler)

      expect(handler).toHaveBeenCalled()
    })

    it('should replay with an error if user does not have admin right', async () => {
      const handler = jest.fn()
      await writingBot.commandCallback(context, handler, true)

      expect(replyMock).toHaveBeenCalledWith(errors.unknownCommand)
    })

    it('should clear session if has any data', async () => {
      context.session = {
        0: {
          data: 'foo',
        },
      }
      await writingBot.commandCallback(context, jest.fn())

      expect(context.session[0]).toEqual({})
    })

    it('should send a message to admin if error occurred', async () => {
      await writingBot.commandCallback(context, async () => {
        throw new Error('some error')
      })

      expect(replyMock).toHaveBeenCalledWith(errors.generic)
      expect(sendMessageMock).toHaveBeenCalledWith(
        'adminID',
        'Something went wrong. Error: some error'
      )
    })
  })

  describe('queries', () => {
    const simpleHandler = jest.fn()
    const chainHandler = jest.fn()

    const queries = [
      {
        type: 'simple',
        handler: simpleHandler,
      },
      {
        type: 'chain',
        handler: chainHandler,
        chainCommand: 'chain_command',
      },
      {
        type: 'error',
        handler: () => {
          throw new Error('some error')
        },
      },
    ]

    beforeEach(() => {
      context.callbackQuery = {}
      context.session = { 0: {} }
    })

    it('should execute query action if exist', async () => {
      context.callbackQuery.data = 'simple'
      await writingBot.callbackQueryHandler(context, queries)

      expect(simpleHandler).toHaveBeenCalled()
    })

    it('should save chain command in the session when defined', async () => {
      context.callbackQuery.data = 'chain'
      await writingBot.callbackQueryHandler(context, queries)

      expect(chainHandler).toHaveBeenCalled()
      expect(context.session?.[0]).toEqual({ type: 'chain_command', stageIndex: 0 })
    })

    it('should replay with an error if query action is not found', async () => {
      context.callbackQuery.data = 'foo'
      await writingBot.callbackQueryHandler(context, queries)

      expect(replyMock).toHaveBeenCalledWith(errors.unknownCommand)
    })

    it('should clear session if has any data', async () => {
      context.callbackQuery.data = 'simple'
      context.session[0] = {
        data: 'foo',
      }
      await writingBot.callbackQueryHandler(context, queries)

      expect(context.session[0]).toEqual({})
    })

    it('should send a message to admin if error occurred', async () => {
      context.callbackQuery.data = 'error'
      await writingBot.callbackQueryHandler(context, queries)

      expect(replyMock).toHaveBeenCalledWith(errors.generic)
      expect(sendMessageMock).toHaveBeenCalledWith(
        'adminID',
        'Something went wrong. Error: some error'
      )
    })
  })

  describe('text input', () => {
    const numberCommandHandler = jest.fn()
    const chainHandler1 = jest.fn()
    const chainHandler2 = jest.fn()

    beforeEach(() => {
      context.session = { 0: {} }
      context.message = {}
    })

    const chainActions = [
      {
        type: 'number_command',
        stages: [
          {
            inputType: 'number' as const,
            handler: numberCommandHandler,
          },
        ],
      },
      {
        type: 'multiple',
        stages: [
          {
            inputType: 'string' as const,
            handler: chainHandler1,
          },
          {
            inputType: 'string' as const,
            handler: chainHandler2,
          },
        ],
      },
      {
        type: 'error',
        stages: [
          {
            inputType: 'string' as const,
            handler: () => {
              throw new Error('some error')
            },
          },
        ],
      },
    ]

    it('should execute text chain with string argument command if exist', async () => {
      const sessionData = {
        type: 'multiple',
        stageIndex: 0,
      }
      context.session[0] = sessionData
      context.message.text = 'some text'

      await writingBot.textInputHandler(context, chainActions)

      expect(chainHandler1).toHaveBeenCalledWith(context, 'some text', sessionData)
    })

    it('should execute text chain command with number argument if exist', async () => {
      const sessionData = {
        type: 'number_command',
        stageIndex: 0,
      }
      context.session[0] = sessionData
      context.message.text = '5'

      await writingBot.textInputHandler(context, chainActions)

      expect(numberCommandHandler).toHaveBeenCalledWith(context, 5, sessionData)
    })

    it('should execute the next command in a chain when stageIndex > 0', async () => {
      const sessionData = {
        type: 'multiple',
        stageIndex: 1,
      }
      context.session[0] = sessionData
      context.message.text = 'text'

      await writingBot.textInputHandler(context, chainActions)

      expect(chainHandler2).toHaveBeenCalledWith(context, 'text', sessionData)
    })

    it('should update stage index when chain is not finished', async () => {
      context.session[0] = {
        data: 'foo',
        type: 'multiple',
        stageIndex: 0,
      }
      context.message.text = 'text'

      await writingBot.textInputHandler(context, chainActions)

      expect(context.session[0]).toEqual({
        data: 'foo',
        type: 'multiple',
        stageIndex: 1,
      })
    })

    it('should clear session when chain is finished', async () => {
      context.session[0] = {
        data: 'foo',
        type: 'multiple',
        stageIndex: 1,
      }
      context.message.text = 'text'

      await writingBot.textInputHandler(context, chainActions)

      expect(context.session[0]).toEqual({})
    })

    it('should replay with an error if query action is not found', async () => {
      context.session[0] = {
        data: 'foo',
        type: 'some_command',
        stageIndex: 0,
      }
      context.message.text = 'text'

      await writingBot.textInputHandler(context, chainActions)

      expect(replyMock).toHaveBeenCalledWith(errors.unknownCommand)
    })

    it('should replay with an error if session is empty', async () => {
      context.session[0] = {}
      context.message.text = 'text'

      await writingBot.textInputHandler(context, chainActions)

      expect(replyMock).toHaveBeenCalledWith(errors.unknownCommand)
    })

    it('should replay with an input error when number input is invalid', async () => {
      const sessionData = {
        type: 'number_command',
        stageIndex: 0,
      }
      context.session[0] = sessionData
      context.message.text = '-5'

      await writingBot.textInputHandler(context, chainActions)

      expect(replyMock).toHaveBeenCalledWith(errors.numberInvalid)
    })

    it('should replay with an input error when text input is invalid', async () => {
      const sessionData = {
        type: 'multiple',
        stageIndex: 0,
      }
      context.session[0] = sessionData
      context.message.text = '--text'

      await writingBot.textInputHandler(context, chainActions)

      expect(replyMock).toHaveBeenCalledWith(errors.stringInvalid)
    })

    it('should send a message to admin if error occurred', async () => {
      context.session[0] = {
        data: 'foo',
        type: 'error',
        stageIndex: 0,
      }
      context.message.text = 'text'

      await writingBot.textInputHandler(context, chainActions)

      expect(replyMock).toHaveBeenCalledWith(errors.generic)
      expect(sendMessageMock).toHaveBeenCalledWith(
        'adminID',
        'Something went wrong. Error: some error'
      )
    })
  })
})
