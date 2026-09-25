---
name: Academic Peer Mentorship Experience
colors:
  surface: '#f9f9ff'
  surface-dim: '#d1daf4'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f3ff'
  surface-container: '#e9edff'
  surface-container-high: '#e1e8ff'
  surface-container-highest: '#d9e2fc'
  on-surface: '#121b2e'
  on-surface-variant: '#434751'
  inverse-surface: '#273044'
  inverse-on-surface: '#edf0ff'
  outline: '#737783'
  outline-variant: '#c3c6d3'
  surface-tint: '#2e5cad'
  primary: '#003880'
  on-primary: '#ffffff'
  primary-container: '#1d4fa0'
  on-primary-container: '#acc5ff'
  inverse-primary: '#aec6ff'
  secondary: '#a93800'
  on-secondary: '#ffffff'
  secondary-container: '#fd7037'
  on-secondary-container: '#5f1c00'
  tertiary: '#004249'
  on-tertiary: '#ffffff'
  tertiary-container: '#005b64'
  on-tertiary-container: '#1ad9ed'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#aec6ff'
  on-primary-fixed: '#001a43'
  on-primary-fixed-variant: '#074394'
  secondary-fixed: '#ffdbcf'
  secondary-fixed-dim: '#ffb59b'
  on-secondary-fixed: '#380d00'
  on-secondary-fixed-variant: '#812900'
  tertiary-fixed: '#92f1ff'
  tertiary-fixed-dim: '#1ddaee'
  on-tertiary-fixed: '#001f23'
  on-tertiary-fixed-variant: '#004f57'
  background: '#f9f9ff'
  on-background: '#121b2e'
  surface-variant: '#d9e2fc'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 2.5rem
    fontWeight: '800'
    lineHeight: 3rem
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.875rem
    fontWeight: '800'
    lineHeight: 2.25rem
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 2rem
    fontWeight: '800'
    lineHeight: 2.5rem
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.5rem
    fontWeight: '800'
    lineHeight: 2rem
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.5rem
    fontWeight: '800'
    lineHeight: 2rem
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.25rem
    fontWeight: '700'
    lineHeight: 1.75rem
    letterSpacing: -0.005em
  subtitle:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.125rem
    fontWeight: '700'
    lineHeight: 1.625rem
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.125rem
    fontWeight: '400'
    lineHeight: 1.75rem
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: 1.6rem
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 1rem
    fontWeight: '600'
    lineHeight: 1.5rem
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.875rem
    fontWeight: '600'
    lineHeight: 1.25rem
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.75rem
    fontWeight: '600'
    lineHeight: 1rem
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system establishes an academic, collaborative, and collegiate aesthetic engineered specifically for peer-to-peer university mentorship. The emotional target is a balance between institutional credibility (academic rigor, focus, structure) and warm peer approachability (empathy, trust, psychological safety). 

The design language adopts a **Corporate / Modern** framework infused with soft institutional warmth. It rejects cold corporate monotony and distracting consumer trends like heavy glassmorphism, hyper-saturated neons, or intrusive gamification. Interactions emphasize dignity, peer solidarity, and intellectual exchange. Visual boundaries are defined through restrained tonal planes and clean hairline borders rather than layered or aggressive drop shadows.

## Colors

The palette is anchored by deep institutional blues and an energetic terracotta/burnt orange CTA, balanced by subtle functional neutrals and high-contrast system feedback colors.

### Core Roles
- **Primary Institutional Blue (`#1D4FA0`)**: Used for authoritative actions, secondary interactive states, standard brand badges, and persistent identity components.
- **Deep Blue (`#1B3E8C`)**: Applied to high-emphasis headers, navigation sidebars, and structural parent containers.
- **Soft Light Blue (`#E8EEF9`)**: Used for subtle surface fills, badge backgrounds, and non-distracting highlight panels.
- **Action Primary CTA (`#BF4409`)**: Reserved strictly for high-conversion driving actions such as "Solicitar Mentoria" or "Confirmar Sessão".
- **Action CTA Hover (`#A83A07`)**: The darkened feedback state for the primary action button.
- **Brand Accent Orange (`#F26522`)**: Strictly non-interactive. Reserved for small brand marks, illustrative badges, and decorative accents.
- **Subtle Cyan (`#00D4E8`)**: Micro-accents, hairpins, and data-status ticks overlaid strictly against deep blue surfaces.

### Surfaces & Boundaries
- **Page Background (`#F4F6FB`)**: A cool, low-strain canvas that mitigates eye fatigue during study sessions.
- **Card Surface (`#FFFFFF`)**: Pure white plane elevating active workspaces, mentor profiles, and request items.
- **Card Stroke (`#DDE3EE`)**: A 1px structural separator providing soft tactile separation.
- **Field Border (`#7B8794`)**: An accessible border color that meets WCAG 2.1 AA (3:1 minimum) non-text contrast against white backgrounds.

### Typography & Readability
- **Primary Text (`#172033`)**: High-contrast, near-black slate prioritizing reading comfort.
- **Secondary Text (`#4A5568`)**: Supporting information, timestamps, and metadata.

### Status Tones
- **Awaiting Response (Pendente)**: Text `#1D4FA0`, Surface `#E8EEF9`
- **Accepted (Aceito)**: Text `#0B6B3A`, Surface `#DDF5E6`
- **Declined (Recusado)**: Text `#B42318`, Surface `#FDECEA`
- **Expired (Expirado)**: Text `#8A4B00`, Surface `#FBEEDC`
- **Cancelled (Cancelado)**: Text `#4A5568`, Surface `#EDF0F4`
- **Destructive Action**: Background `#B42318`, Hover `#9E1E13`, Text `#FFFFFF`

## Typography

The type scale is executed entirely in **Plus Jakarta Sans**, utilizing its geometric yet approachable character to communicate precision without feeling overly bureaucratic.

- **Weight Disciplines**:
  - **Headings (800)**: Used exclusively for major page titles and prominent modal anchors.
  - **Subheadings (700)**: Applied to sectional titles, card groupings, and mentor profile names.
  - **Labels, Buttons, and Statuses (600)**: Provides immediate visual legibility for interactive controls, form metadata, and status badges.
  - **Body (400)**: Applied across all long-form academic descriptions, peer bios, and instructions. The base text size never falls below 16px (`1rem`) to support uncompromised accessibility.
- **Hierarchy Rules**: Maintain comfortable vertical rhythm with a 1.5–1.6 ratio on running text. Numeric values (dates, times, room numbers) use tabular figure alignments when presented in lists.

## Layout & Spacing

The layout is built on a responsive 12-column grid on desktop, scaling to 8 columns on tablet, and 4 columns on mobile. Maximum layout content width is restricted to `1200px` to maintain optimal line lengths for reading scholarly profiles and descriptions.

- **Desktop (>= 1024px)**: 12 columns, 24px (`1.5rem`) gutters, 32px (`2rem`) screen margins.
- **Tablet (768px - 1023px)**: 8 columns, 20px (`1.25rem`) gutters, 24px (`1.5rem`) margins. Side-by-side mentor lists collapse gracefully into a 2-column format.
- **Mobile (< 768px)**: 4 columns, 16px (`1rem`) gutters, 16px (`1rem`) margins. Vertical stacks dominate, multi-column forms collapse to single-column cascades, and interactive touch controls stretch to full component width when applicable.
- **Density**: Spacing is generous (`space-md` to `space-xl`) between distinct functional modules, preventing academic anxiety and information overload.

## Elevation & Depth

This design system avoids dense, blurred shadows and heavy visual skeuomorphism. It utilizes a **Tonal Layer + Low-Contrast Outline** model to establish clean, daylight-style depth.

- **Base Layer (Canvas)**: Background `#F4F6FB` acts as the primary substrate.
- **Surface Layer (Cards, Modules)**: Flat `#FFFFFF` bound by a solid 1px hairline stroke in `#DDE3EE`.
- **Hover/Active Elevation**: When hovering interactive cards, no dramatic vertical lift is applied. Instead, the border shifts smoothly from `#DDE3EE` to `#1D4FA0` alongside a subtle tinted shadow: `0 4px 16px -2px rgba(29, 79, 160, 0.08)`.
- **Modals and Drawers**: Resting at the highest z-index, accompanied by a clean non-distracting scrim (`rgba(23, 32, 51, 0.45)`) and a structured shadow: `0 8px 30px rgba(23, 32, 51, 0.12)`.

## Shapes

The geometric personality blends structured technical discipline with human warmth:

- **Cards and Panels**: Hard-coded to `12px` (`0.75rem`) corner radius. This softens technical density while maintaining architectural order.
- **Buttons, Text Inputs, and Dropdowns**: Standardized to `8px` (`0.5rem`) corner radius, signaling crisp interactivity and precision.
- **Chips, Badges, and Status Tags**: Built as full pills (`9999px`), distinguishing status indicators from clickable actionable rectangular buttons.
- **Accessibility & Focus Rings**: All interactive states must display an unobstructed focus outline: a `2px` solid stroke of `#1D4FA0` offset by a `2px` white buffer (`outline-offset: 2px`).
- **Touch Bounds**: All actionable targets (buttons, links, selectable pill badges) must strictly respect a minimum touch bounding box of `44x44px`.

## Components

### Buttons
- **Primary Action (CTA)**: Background `#BF4409`, Text `#FFFFFF`, font weight 600, border-radius 8px. Hover state: `#A83A07`. Reserved strictly for primary flow completions (e.g., "Confirmar Agendamento").
- **Secondary (Institutional)**: Background `#1D4FA0`, Text `#FFFFFF`. Hover state: `#1B3E8C`.
- **Ghost / Tertiary**: Background transparent, Text `#1D4FA0`, 1px border `#1D4FA0`. Hover state: Background `#E8EEF9`.
- **Destructive**: Background `#B42318`, Text `#FFFFFF`. Hover state: `#9E1E13`.
- **Sizing**: Minimum height of 44px on mobile and desktop, horizontal padding 20px (`1.25rem`).

### Form Inputs & Fields
- **Container**: White surface (`#FFFFFF`), border 1px solid `#7B8794`, 8px border-radius, minimum height 48px, horizontal padding 16px.
- **Labels**: Weight 600, color `#172033`, font-size 14px (`label-md`). Placed outside the input container for clear cognitive parsing.
- **Focus State**: Border shifts to `#1D4FA0` accompanied by the standard 2px focus ring.
- **Helper/Validation Text**: Placed below input; validation errors use `#B42318` with an accompanying warning icon.

### Cards (Mentor Profile & Request Cards)
- **Base Style**: Pure white `#FFFFFF` surface, 1px solid `#DDE3EE` boundary, 12px border-radius, padding 24px (`1.5rem`).
- **Interaction**: Profile cards feature a border-color transition to `#1D4FA0` and subtle tinted elevation on cursor hover.

### Status Pills
- Compact, fully rounded pill containers (`border-radius: 9999px`) with padding `4px 12px`.
- Font weight 600, font size 12px (`label-sm`).
- Pre-defined themes:
  - *Aguardando*: Text `#1D4FA0` | Fill `#E8EEF9`
  - *Aceito*: Text `#0B6B3A` | Fill `#DDF5E6`
  - *Recusado*: Text `#B42318` | Fill `#FDECEA`
  - *Expirado*: Text `#8A4B00` | Fill `#FBEEDC`
  - *Cancelado*: Text `#4A5568` | Fill `#EDF0F4`

### Compatibility Badge ("Combina bem com você")
- **Visual Design**: Pill shape, background `#E8EEF9`, text `#1D4FA0`, subtle primary institutional icon (e.g., sparkling peer handshake or star outline).
- **Rule**: Completely qualitative and descriptive. Numerical figures, match scores, and percentages are strictly prohibited to maintain peer warmth and prevent comparative student anxiety.

### Checkboxes & Radios
- Size 20x20px with centered alignment inside a minimum 44x44px clickable touch target.
- Unchecked: 1.5px border `#7B8794`, background `#FFFFFF`.
- Checked: Background `#1D4FA0`, border `#1D4FA0`, white checkmark or center-dot indicator.