const elProps = new WeakMap()
const elValue = new WeakMap()

function addSeparators(e) {
  const number = parseInt(e.key)
  const props = elProps.get(e.target)

  // Keep a record of the value since it can removed when losing focus
  elValue.set(e.target, e.target.value)

  if (!isNaN(number)) {
    if (props.timeOnly) {
      if (e.target.value.length === 2) e.target.value += ':'
    } else {
      const datetimeParts = e.target.value.split(' ')
      const dateParts = datetimeParts[0].split('/')

      if (
        (number > 3 && dateParts.length <= 2) ||
        (dateParts.length <= 2 && dateParts.at(-1).length === 2)
      )
        e.target.value += '/'

      if (props.showTime) {
        if (datetimeParts.length <= 1 && dateParts[2]?.length == 4)
          e.target.value += ' '
        if (datetimeParts[1]?.length === 2) e.target.value += ':'
      }
    }
  }
}

function autoComplete(e) {
  const value = e.target.value || elValue.get(e.target)
  const props = elProps.get(e.target)

  if (props.timeOnly) {
    e.target.value = autoCompleteTime(value, props.stepMinute)
  } else {
    const datetimeParts = value.split(' ')

    const date = autoCompleteYear(datetimeParts[0], 2)

    const time = props.showTime
      ? autoCompleteTime(datetimeParts[1], props.stepMinute)
      : ''

    e.target.value = date + ' ' + time
  }

  if (e.target.value !== value) e.target.dispatchEvent(new Event('input'))
}

function autoCompleteYear(date, index, separator = '/') {
  const parts = date.split(separator)

  if (!parts[index]) parts[index] = new Date().getFullYear()
  else if (parts[index].length === 2)
    parts[index] = 2000 + parseInt(parts[index], 10)

  return parts.join(separator)
}

function autoCompleteTime(date = '', stepMinute = null, separator = ':') {
  const parts = date.split(separator)
  if (parts.length < 2) parts.push('00')

  if (stepMinute)
    parts[1] = (Math.round(parts[1] / stepMinute) * stepMinute).toString()

  parts[0] = parts[0].padStart(2, '0')
  parts[1] = parts[1].padStart(2, '0')

  return parts.join(separator)
}

export default {
  mounted(el, binding, vnode) {
    elProps.set(el.querySelector('input') || el, vnode.ctx.props)

    el.addEventListener('keyup', addSeparators)
    el.addEventListener('blur', autoComplete, true)
  },
  beforeUnmount(el) {
    el.removeEventListener('keyup', addSeparators)
    el.removeEventListener('blur', autoComplete, true)
  },
}
