# Digvation NewUi — canonical migration

OldUi is no longer kept as a second `Base*` API. Its reusable behavior, logic, styling intent, and props are merged directly into the canonical NewUi components.

## Naming convention

- folder: kebab-case, e.g. `range-date-picker/`
- implementation: matching kebab-case file, e.g. `range-date-picker.tsx`
- component/type: PascalCase, e.g. `RangeDatePicker`, `RangeDatePickerProps`
- named exports only
- one implementation per component

## OldUi -> canonical NewUi

- `BaseInput` -> `Input`
- `BaseTextarea` -> `Textarea`
- `BaseSearchInput` -> `SearchInput`
- `BaseSelect` -> `Select`
- `BaseAutocomplete` -> `Combobox`
- `BaseDropdown` -> `Dropdown`
- `BaseDatePicker` -> `DatePicker`
- `BaseRangeDatePicker` -> `RangeDatePicker`
- `BaseToggle` -> `Toggle`
- `BaseButton` -> `Button`
- `BaseBadge` -> `Badge`
- `BaseSkeleton` -> `Skeleton`
- `BaseDialog` -> `Dialog`
- `DataTable` -> `DataTable`
- `BaseSelectFilter` -> `SelectFilter`
- `ToastContainer` -> `ToastContainer`
- `SplashScreen` -> `SplashScreen`

The other generic old components are available directly as `ConfirmDialog`, `ConnectionError`, `DateRangeFilter`, `ExportButton`, `InfoNote`, `NotificationPanel`, and `StatusFilter`.

## Important callback compatibility

`Input` intentionally keeps oldUi's value-first callback:

```tsx
<Input onChange={(value, event) => setValue(value)} />
```

When a native React change event is specifically needed, use the additive `onNativeChange` prop:

```tsx
<Input onNativeChange={(event) => setValue(event.target.value)} />
```

`Textarea` follows the same rule. `Select` keeps the old `onChange(value)` contract and also exposes `onValueChange(value)` as an additive convenience.

## Shared foundation

There is no parallel Base component tree. Cross-component foundations are shared directly:

- `dropdown/` — one positioning/open-close/context engine used by Select, Combobox, DatePicker, RangeDatePicker, DataTable menus, ExportButton, and SelectFilter.
- `shared/field-size.ts` — one input sizing definition used across field components.

## Intentionally not moved into reusable UI

`PaymentDialog`, `ReceiveItemDialog`, and the router-bound old `KpiCards` depend on Digvation application hooks/types/router state. They should live in the application feature layer and consume these canonical UI components rather than making the UI package depend on application code.
