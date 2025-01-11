import { getWordForm } from '../get-word-form'

const forms = ['1', '2', '3'] as const

describe('getWordForm', () => {
  it('Should return first form when amount has residue 1 modulo 10 and not divisible by 11', () => {
    expect(getWordForm(1, forms)).toBe('1')
    expect(getWordForm(21, forms)).toBe('1')
    expect(getWordForm(101, forms)).toBe('1')

    expect(getWordForm(-1, forms)).toBe('1')
    expect(getWordForm(-21, forms)).toBe('1')
    expect(getWordForm(-101, forms)).toBe('1')
  })

  it('Should return second form when amount has residue 2-4 modulo 10', () => {
    expect(getWordForm(2, forms)).toBe('2')
    expect(getWordForm(23, forms)).toBe('2')
    expect(getWordForm(104, forms)).toBe('2')

    expect(getWordForm(-2, forms)).toBe('2')
    expect(getWordForm(-23, forms)).toBe('2')
    expect(getWordForm(-104, forms)).toBe('2')
  })

  describe('Should return third form ', () => {
    it('Should return third form when amount has residue greater than 5 modulo 10', () => {
      expect(getWordForm(5, forms)).toBe('3')
      expect(getWordForm(26, forms)).toBe('3')
      expect(getWordForm(100, forms)).toBe('3')
    })

    it('Should return third form when amount has residue between 11 and 19 modulo 100', () => {
      expect(getWordForm(11, forms)).toBe('3')
      expect(getWordForm(12, forms)).toBe('3')
      expect(getWordForm(19, forms)).toBe('3')
    })
  })
})
