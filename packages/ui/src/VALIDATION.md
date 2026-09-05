# Validation notes

## Structural rules
- No `base/` compatibility layer.
- No `Base*` component/type names in source.
- No duplicate PascalCase/kebab-case implementation files.
- No default exports; public components use named exports consistently.
- `DataTable` lives in `data-table/data-table.tsx`.
- `RangeDatePicker` lives in `range-date-picker/range-date-picker.tsx`.
- `Dropdown` is the single shared dropdown engine.
- Shared field sizing lives only in `shared/field-size.ts`.

## OldUi behavior retained
- Input: `onChange(value, event)`, clear emits empty value, password visibility, number zero handling, currency/percentage sanitizing and display adornments, label info, sizing, error/hint.
- Textarea: legacy value callback, clear behavior, label/error/hint.
- SearchInput: local state, first-mount suppression, debounce, immediate clear, outside collapse, mobile expanded mode, desktop expandable mode/focus.
- Select: static/async options, search, selected resolution, clear, controlled/uncontrolled value, keyboard navigation, dropdown sharing.
- Combobox: async fetch/search, create option, render overrides, clear, selected resolution, shared dropdown.
- DatePicker / RangeDatePicker: old display/calendar interactions; range quick presets retained.
- Toggle: label position, full width, size, gap, checked callback.
- Dialog: old title/description/footer/size/overlay/close/mobile-sheet behavior plus focus containment and exit animation.
- DataTable: old search/filter/header-actions, pagination/page-size, sortDir compatibility, actions, mobile cards, cell type/transform formatting.
- SelectFilter: old inline-label-with-separator trigger layout retained as a distinct component.
- Button / Badge / Skeleton / Toast / SplashScreen and generic base composites retain old styling intent while using NewUi design tokens.

## Validation performed
- TypeScript transpile/syntax pass over every `.ts` and `.tsx` file.
- Relative import resolution pass.
- Old explicit prop-name coverage audit for the canonical replacements.
- No `Base*` source references.
- No stale `base/`, `foundation-badge`, or old table import paths.
- No application aliases/hooks/router/store dependencies in the reusable UI source.

The original runtime test suite still requires the host project's React/Vitest dependencies to execute.
