# Gradeway-Style GPA Calculator & Rank System Design

## 1. Overview
Ascend GPA Calculator provides a clean, accurate GPA calculation and "What-If" simulator modeled after Gradeway and grounded in Round Rock ISD's high school grading & GPA policy.

## 2. Weighting & Scale Rules (Round Rock High School / RRISD)

### A. Unweighted GPA (Left Side — 4.0 Scale)
* **Scope**: All credit-bearing high school courses (including `Lifetime Fitness & Wellness`, `Intro Engineering Design`, `Spanish`, core classes, and transcript credits).
* **Bracket Formula**:
  * 90 – 100: **4.0** (A 90 contributes the exact same 4.0 as a 100)
  * 80 – 89: **3.0**
  * 70 – 79: **2.0**
  * < 70: **0.0**
* **Calculation**:
  $$\text{Unweighted GPA} = \frac{\sum (\text{Unweighted Points} \times \text{Credits})}{\sum \text{Credits}}$$

### B. Weighted GPA (Right Side — 6.0 Scale)
* **Scope**: Only qualifying academic weighted classes. Electives/classes designated as unweighted (such as `Intro Engineering Design` and `Lifetime Fitness & Wellness`) do **not** contribute to weighted GPA—they are excluded from both numerator and denominator so they never dilute the student's 6.0 average.
* **Tiers**:
  * **Tier 1 — AP & Advanced / TAG (Exact Same Contribution)**:
    * 100 = **6.0**
    * 90 = **5.0**
    * Formula for $G \ge 70$: $\text{Points} = 6.0 - (100 - G) \times 0.1 = \frac{G - 40}{10}$
    * Applied to: `AP Comp Sci Principles`, `TAG/AP Human Geography`, `TAG/Advanced Alg II`, `TAG/Advanced Biology`, `TAG/Advanced English I`, `Advanced Spanish III`.
  * **Tier 2 — On-Level / Regular Weighted Courses**:
    * 100 = **5.0** (a 100 in on-level earns a 5.0, exactly equal to a 90 in AP/Advanced)
    * 90 = **4.0**
    * Formula for $G \ge 70$: $\text{Points} = 5.0 - (100 - G) \times 0.1 = \frac{G - 50}{10}$
    * Applied to: On-level Spanish, on-level core classes.
  * **Unweighted Only**:
    * Points = None (0 weighted weight).
    * Applied to: `Intro Engineering Design`, `Lifetime Fitness & Wellness`.
* **Calculation**:
  $$\text{Weighted GPA} = \frac{\sum (\text{Weighted Points} \times \text{Credits})}{\sum \text{Weighted Credits}}$$

### C. Class Rank Detection
* Backend checks `profile.transcript.gpa.rank` and `profile.transcript.gpa.classSize` from HAC scraping/HAR.
* If official rank is null (standard for Grade 09 before sophomore/junior official release), display a status pill: `Official Rank Pending (Grade 09) · Released by RRISD in 10th/11th` with estimated cohort percentile.

## 3. UI/UX Layout (Gradeway Inspired)

1. **Left Sidebar Navigation Tab**:
   * Renamed/added as `GPA Calculator` with a graduation cap / calculator icon.
2. **Top Header Split Cards**:
   * **Left Card**: Unweighted GPA (`4.000` scale, grade bracket indicator, circular quality ring).
   * **Right Card**: Weighted GPA (`6.000` scale, glowing accent, weight differential badge).
   * **Middle / Stat Pill**: Official HAC Class Rank & Credits summary.
3. **Course Breakdown List (Below Header)**:
   * Individual clean card for every current course:
     * Course title, period, teacher.
     * Category dropdown pill:
       * `AP / Advanced (6.0)`
       * `On-Level Weighted (5.0)`
       * `Unweighted Only (4.0 Only)`
       * `Non-GPA / Excluded`
     * Live interactive grade pill + "What-If" slider / input to simulate score changes in real-time.
     * Earned points indicator (e.g. `UW: 4.0 · W: 6.0`).
4. **Historical Transcript Option**:
   * Expandable toggle to include Middle School HS credit courses (Alg 1, Spanish 1, Spanish 2, etc.) into cumulative calculations.
