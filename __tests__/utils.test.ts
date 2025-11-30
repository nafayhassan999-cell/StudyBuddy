import { describe, it, expect, vi } from 'vitest'

describe('Utility Functions', () => {
  describe('Date Utilities', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15')
      expect(date.toLocaleDateString()).toBeDefined()
    })

    it('should calculate date difference', () => {
      const date1 = new Date('2024-01-01')
      const date2 = new Date('2024-01-10')
      const diff = Math.abs(date2.getTime() - date1.getTime())
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
      expect(days).toBe(9)
    })

    it('should check if date is in the past', () => {
      const pastDate = new Date('2020-01-01')
      const now = new Date()
      expect(pastDate < now).toBe(true)
    })

    it('should check if date is in the future', () => {
      const futureDate = new Date('2030-01-01')
      const now = new Date()
      expect(futureDate > now).toBe(true)
    })
  })

  describe('String Utilities', () => {
    it('should trim whitespace', () => {
      const input = '  hello world  '
      expect(input.trim()).toBe('hello world')
    })

    it('should convert to lowercase', () => {
      const input = 'HELLO WORLD'
      expect(input.toLowerCase()).toBe('hello world')
    })

    it('should convert to uppercase', () => {
      const input = 'hello world'
      expect(input.toUpperCase()).toBe('HELLO WORLD')
    })

    it('should split string by delimiter', () => {
      const input = 'apple,banana,cherry'
      expect(input.split(',')).toEqual(['apple', 'banana', 'cherry'])
    })

    it('should check if string includes substring', () => {
      const input = 'hello world'
      expect(input.includes('world')).toBe(true)
    })
  })

  describe('Array Utilities', () => {
    it('should filter array elements', () => {
      const arr = [1, 2, 3, 4, 5]
      const filtered = arr.filter(n => n > 3)
      expect(filtered).toEqual([4, 5])
    })

    it('should map array elements', () => {
      const arr = [1, 2, 3]
      const mapped = arr.map(n => n * 2)
      expect(mapped).toEqual([2, 4, 6])
    })

    it('should reduce array to single value', () => {
      const arr = [1, 2, 3, 4, 5]
      const sum = arr.reduce((acc, n) => acc + n, 0)
      expect(sum).toBe(15)
    })

    it('should find element in array', () => {
      const arr = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]
      const found = arr.find(item => item.id === 2)
      expect(found?.name).toBe('Bob')
    })

    it('should sort array', () => {
      const arr = [3, 1, 4, 1, 5, 9, 2, 6]
      const sorted = [...arr].sort((a, b) => a - b)
      expect(sorted).toEqual([1, 1, 2, 3, 4, 5, 6, 9])
    })
  })

  describe('Object Utilities', () => {
    it('should get object keys', () => {
      const obj = { a: 1, b: 2, c: 3 }
      expect(Object.keys(obj)).toEqual(['a', 'b', 'c'])
    })

    it('should get object values', () => {
      const obj = { a: 1, b: 2, c: 3 }
      expect(Object.values(obj)).toEqual([1, 2, 3])
    })

    it('should merge objects', () => {
      const obj1 = { a: 1, b: 2 }
      const obj2 = { c: 3, d: 4 }
      const merged = { ...obj1, ...obj2 }
      expect(merged).toEqual({ a: 1, b: 2, c: 3, d: 4 })
    })

    it('should check object has property', () => {
      const obj = { name: 'John', age: 30 }
      expect('name' in obj).toBe(true)
      expect('email' in obj).toBe(false)
    })
  })
})
