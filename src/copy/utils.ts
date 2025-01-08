export function getWordForm(
  amount: number,
  forms: readonly [string, string, string]
): string {
  if (amount % 10 === 1 && amount % 100 !== 11) {
    return forms[0]
  }
  if (
    amount % 10 > 1 &&
    amount % 10 < 5 &&
    (amount % 100 < 10 || amount % 100 > 20)
  ) {
    return forms[1]
  }

  return forms[2]
}
