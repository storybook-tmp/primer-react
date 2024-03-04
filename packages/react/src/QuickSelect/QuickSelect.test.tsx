import {render as HTMLRender} from '@testing-library/react'
import {axe} from 'jest-axe'
import React from 'react'
import theme from '../theme'
import {QuickSelect} from '../QuickSelect'
import {behavesAsComponent, checkExports} from '../utils/testing'
import {BaseStyles, SSRProvider, ThemeProvider} from '..'
import type {ItemInput} from '../deprecated/ActionList/List'

const items = [{text: 'Foo'}, {text: 'Bar'}, {text: 'Baz'}, {text: 'Bon'}] as ItemInput[]

function SimpleQuickSelect(): JSX.Element {
  const [selected, setSelected] = React.useState<ItemInput[]>([])
  const [, setFilter] = React.useState('')
  const [open, setOpen] = React.useState(false)

  return (
    <ThemeProvider theme={theme}>
      <SSRProvider>
        <BaseStyles>
          <QuickSelect
            items={items}
            placeholder="Select Items"
            placeholderText="Filter Items"
            selected={selected}
            onSelectedChange={setSelected}
            onFilterChange={setFilter}
            open={open}
            onOpenChange={setOpen}
          />
          <div id="portal-root"></div>
        </BaseStyles>
      </SSRProvider>
    </ThemeProvider>
  )
}

describe('QuickSelect', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  behavesAsComponent({
    Component: QuickSelect,
    options: {skipAs: true, skipSx: true},
    toRender: () => <SimpleQuickSelect />,
  })

  checkExports('QuickSelect', {
    default: undefined,
    QuickSelect,
  })

  it('should have no axe violations', async () => {
    const {container} = HTMLRender(<SimpleQuickSelect />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
