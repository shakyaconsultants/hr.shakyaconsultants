# Date & Time UX Audit — Standardization Report

Completed: 2026-06-26  
Scope: Frontend only — no backend/business logic changes.

## Reusable Components Created

| Component | Path | Purpose |
|-----------|------|---------|
| **DatePicker** | `frontend/src/shared/components/date-picker.tsx` | Calendar popover, min/max, disabled dates, clear, no manual typing |
| **TimePicker** | `frontend/src/shared/components/time-picker.tsx` | Scrollable time list, 12/24h display, filter, keyboard Enter, clear |
| **DateTimePicker** | `frontend/src/shared/components/datetime-picker.tsx` | Combined date + time panels, ISO export helper |
| **DurationInput** | `frontend/src/shared/components/duration-input.tsx` | Validated numeric duration with unit suffix |
| **DateRangeFields** | `frontend/src/shared/components/date-range-fields.tsx` | Paired from/to filters for filter bars |
| **datetime utils** | `frontend/src/shared/utils/datetime.ts` | Parsing, formatting, working-hours calculation, validation |
| **useTimeFormat** | `frontend/src/shared/hooks/use-time-format.ts` | 12h/24h preference (localStorage) |

## Work Shift Module (Full Refactor)

Dedicated page: `WorkShiftListPage` → `frontend/src/features/organization/work-shifts/`

| Section | Fields | Component |
|---------|--------|-----------|
| Basic Information | Shift Name, Description, Status | Input, textarea, AsyncSearchSelect |
| Schedule | Start/End Time, Grace, Break, Working Hours (auto), Weekly Off, Overnight | TimePicker, DurationInput, calculated display, checkboxes |
| Rules | Late Mark After, Half Day After, Overtime, Flexible Shift | DurationInput, toggles |

Payload maps to existing backend schema (`gracePeriodMinutes`, `breakMinutes`, `isNightShift`, `attendanceRules`, etc.).

## Fields Standardized by Module

### Organization
| Field | Location | Component |
|-------|----------|-----------|
| Holiday Date | Entity form (holiday) | DatePicker |
| Max Days/Year | Entity form (leave-type) | DurationInput (days) |
| Work Shift (all schedule/time fields) | Work Shift list/form | TimePicker, DurationInput |

### Employee
| Field | Location | Component |
|-------|----------|-----------|
| Joining Date | Employee create dialog | DatePicker |

### Leave & Exit
| Field | Location | Component |
|-------|----------|-----------|
| Leave Start Date | Apply leave | DatePicker + range validation |
| Leave End Date | Apply leave | DatePicker + range validation |
| Notice Period (days) | Resignation | DurationInput |
| Expected Last Working Day | Resignation | DatePicker (min: today) |

### Attendance
| Field | Location | Component |
|-------|----------|-----------|
| Shift assignment Effective From | Attendance enterprise | DatePicker |
| Report Start/End Date | Attendance reports | DatePicker |
| Grace / Late / Early exit / Half-day / Auto-absent thresholds | Policy settings | DurationInput |

### Recruitment
(No manual date/time inputs remained in forms — candidate flows use text fields only.)

### Projects
| Field | Location | Component |
|-------|----------|-----------|
| Project Start Date | Projects list quick-create | DatePicker |
| Start / Target Date | Project wizard | DatePicker |
| Milestone Due Date | Project wizard / admin panel | DatePicker |
| Sprint Start / End | Project wizard / admin panel | DatePicker |
| Project settings dates | Project administration panel | DatePicker |

### Payroll
| Field | Location | Component |
|-------|----------|-----------|
| Effective From | Salary revision wizard | DatePicker |
| Effective From | Compensation assignment | DatePicker |
| Report Start/End | Payroll reports | DatePicker |

### Sales
| Field | Location | Component |
|-------|----------|-----------|
| Follow-up Scheduled At | Lead activity form | DateTimePicker |
| Call Duration | Lead activity form | DurationInput (sec) |
| Report Start/End | Sales reports | DatePicker |

### Communication
| Field | Location | Component |
|-------|----------|-----------|
| Schedule At | Announcement form | DateTimePicker |
| Expires At | Announcement form | DateTimePicker |
| Report Start/End | Communication reports | DatePicker |

### Reports (Global)
| Field | Location | Component |
|-------|----------|-----------|
| Start / End Date | Report filters component | DatePicker |

### Settings / Integration
| Field | Location | Component |
|-------|----------|-----------|
| Audit log From / To | Audit explorer | DatePicker |
| Integration log From / To | Integration logs | DatePicker |
| API Key Expires | API key form | DatePicker (min: today) |

## Validation Added

- **Date ranges**: End ≥ Start on leave, reports, project dates, sprint dates, announcements (expires ≥ schedule)
- **Time ranges**: End after start on work shifts (unless overnight shift)
- **Past dates blocked**: Resignation last working day, API key expiry, announcement schedule (min: now)
- **Duration bounds**: Min 0, max per field (grace, break, policy thresholds)
- **Inline errors**: DatePicker, TimePicker, DateTimePicker, DurationInput, SelectField

## Removed Patterns

- All native `<input type="date">` — **0 remaining**
- All native `<input type="datetime-local">` — **0 remaining**
- Manual `HH:mm` text fields — **0 remaining** (replaced by TimePicker)

## TypeScript

`npm run typecheck` passes after all changes.
