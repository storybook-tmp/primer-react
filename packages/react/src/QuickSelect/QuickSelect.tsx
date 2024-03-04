import React from 'react'
import {SearchIcon, TriangleDownIcon} from '@primer/octicons-react'
import {useRef, useCallback, useMemo} from 'react'
import type {AnchoredOverlayProps} from '../AnchoredOverlay'
import {AnchoredOverlay} from '../AnchoredOverlay'
import type {AnchoredOverlayWrapperAnchorProps} from '../AnchoredOverlay/AnchoredOverlay'
import Box from '../Box'
import type {FilteredActionListProps} from '../FilteredActionList'
import {FilteredActionList} from '../FilteredActionList'
import Heading from '../Heading'
import type {OverlayProps} from '../Overlay'
import type {TextInputProps} from '../TextInput'
import type {ItemProps} from '../deprecated/ActionList'
import type {ItemInput} from '../deprecated/ActionList/List'
import {Button} from '../Button'
import {useProvidedRefOrCreate} from '../hooks'
import type {FocusZoneHookSettings} from '../hooks/useFocusZone'
import {useId} from '../hooks/useId'
import {useProvidedStateOrCreate} from '../hooks/useProvidedStateOrCreate'

interface QuickSelectSingleSelection {
  selected: ItemInput | undefined
  onSelectedChange: (selected: ItemInput | undefined) => void
}

interface QuickSelectMultiSelection {
  selected: ItemInput[]
  onSelectedChange: (selected: ItemInput[]) => void
}

interface QuickSelectBaseProps {
  title: string | React.ReactElement
  description?: string
  onOpenChange: (
    open: boolean,
    gesture: 'anchor-click' | 'anchor-key-press' | 'click-outside' | 'escape' | 'selection',
  ) => void
  placeholder?: string
  inputLabel?: string
  overlayProps?: Partial<OverlayProps>
}

export type QuickSelectProps = QuickSelectBaseProps &
  Omit<FilteredActionListProps, 'selectionVariant'> &
  Pick<AnchoredOverlayProps, 'open'> &
  AnchoredOverlayWrapperAnchorProps &
  (QuickSelectSingleSelection | QuickSelectMultiSelection)

function isMultiSelectVariant(
  selected: QuickSelectSingleSelection['selected'] | QuickSelectMultiSelection['selected'],
): selected is QuickSelectMultiSelection['selected'] {
  return Array.isArray(selected)
}

const focusZoneSettings: Partial<FocusZoneHookSettings> = {
  // Let FilteredActionList handle focus zone
  disabled: true,
}

export function QuickSelect({
  open,
  onOpenChange,
  renderAnchor = props => {
    const {children, ...rest} = props
    return (
      <Button trailingAction={TriangleDownIcon} {...rest}>
        {children}
      </Button>
    )
  },
  anchorRef: externalAnchorRef,
  placeholder,
  placeholderText = 'Filter items',
  inputLabel = placeholderText,
  selected,
  title = isMultiSelectVariant(selected) ? 'Select items' : 'Select an item',
  description,
  onSelectedChange,
  filterValue: externalFilterValue,
  onFilterChange: externalOnFilterChange,
  items,
  textInputProps,
  overlayProps,
  sx,
  ...listProps
}: QuickSelectProps): JSX.Element {
  const titleId = useId()
  const descriptionId = useId()
  const [filterValue, setInternalFilterValue] = useProvidedStateOrCreate(externalFilterValue, undefined, '')
  const onFilterChange: FilteredActionListProps['onFilterChange'] = useCallback(
    (value: string, e: unknown) => {
      externalOnFilterChange(value, e)
      setInternalFilterValue(value)
    },
    [externalOnFilterChange, setInternalFilterValue],
  )

  const anchorRef = useProvidedRefOrCreate(externalAnchorRef)
  const onOpen: AnchoredOverlayProps['onOpen'] = useCallback(
    (gesture: Parameters<Exclude<AnchoredOverlayProps['onOpen'], undefined>>[0]) => onOpenChange(true, gesture),
    [onOpenChange],
  )
  const onClose = useCallback(
    (gesture: Parameters<Exclude<AnchoredOverlayProps['onClose'], undefined>>[0] | 'selection') => {
      onOpenChange(false, gesture)
    },
    [onOpenChange],
  )

  const renderMenuAnchor = useMemo(() => {
    if (renderAnchor === null) {
      return null
    }

    const selectedItems = Array.isArray(selected) ? selected : [...(selected ? [selected] : [])]

    return <T extends React.Attributes>(props: T) => {
      return renderAnchor({
        ...props,
        children: selectedItems.length ? selectedItems.map(item => item.text).join(', ') : placeholder,
      })
    }
  }, [placeholder, renderAnchor, selected])

  const handleSelectionChange = useCallback(
    (newSelection: (ItemInput | undefined) & ItemInput[]) => {
      onSelectedChange(newSelection) // Update the selection
      onOpenChange(false, 'selection') // Close the menu
    },
    [onSelectedChange, onOpenChange],
  )

  const itemsToRender = useMemo(
    () =>
      items.map(item => {
        const isItemSelected = isMultiSelectVariant(selected) ? selected.includes(item) : selected === item

        return {
          ...item,
          role: 'option',
          selected: isItemSelected,
          onAction: (itemFromAction: unknown, event: {defaultPrevented: unknown}) => {
            if (event.defaultPrevented) {
              return
            }

            if (isMultiSelectVariant(selected)) {
              const newSelectedItems = selected.includes(item)
                ? selected.filter(selectedItem => selectedItem !== item)
                : [...selected, item]
              handleSelectionChange(newSelectedItems)
            } else {
              handleSelectionChange(item === selected ? undefined : item)
            }
          },
        }
      }),
    [handleSelectionChange, selected, items],
  )

  const inputRef = useRef<HTMLInputElement>(null)
  const focusTrapSettings = {
    initialFocusRef: inputRef,
  }

  const extendedTextInputProps: Partial<TextInputProps> = useMemo(() => {
    return {
      sx: {m: 2},
      contrast: true,
      leadingVisual: SearchIcon,
      'aria-label': inputLabel,
      ...textInputProps,
    }
  }, [inputLabel, textInputProps])

  return (
    <AnchoredOverlay
      renderAnchor={renderMenuAnchor}
      anchorRef={anchorRef}
      open={open}
      onOpen={onOpen}
      onClose={onClose}
      overlayProps={{
        role: 'none',
        'aria-labelledby': titleId,
        'aria-describedby': description ? descriptionId : undefined,
        ...overlayProps,
      }}
      focusTrapSettings={focusTrapSettings}
      focusZoneSettings={focusZoneSettings}
    >
      <Box sx={{display: 'flex', flexDirection: 'column', height: 'inherit', maxHeight: 'inherit'}}>
        <Box sx={{pt: 2, px: 3}}>
          <Heading as="h1" id={titleId} sx={{fontSize: 1}}>
            {title}
          </Heading>
          {description ? (
            <Box id={descriptionId} sx={{fontSize: 0, color: 'fg.muted'}}>
              {description}
            </Box>
          ) : null}
        </Box>
        <FilteredActionList
          filterValue={filterValue}
          onFilterChange={onFilterChange}
          placeholderText={placeholderText}
          {...listProps}
          role="listbox"
          aria-multiselectable={isMultiSelectVariant(selected) ? 'true' : 'false'}
          selectionVariant={isMultiSelectVariant(selected) ? 'multiple' : 'single'}
          items={itemsToRender}
          textInputProps={extendedTextInputProps}
          inputRef={inputRef}
          // inheriting height and maxHeight ensures that the FilteredActionList is never taller
          // than the Overlay (which would break scrolling the items)
          sx={{...sx, height: 'inherit', maxHeight: 'inherit'}}
        />
      </Box>
    </AnchoredOverlay>
  )
}

QuickSelect.displayName = 'QuickSelect'
