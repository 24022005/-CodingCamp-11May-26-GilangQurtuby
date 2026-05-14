# Requirements Document

## Introduction

The Expense Budget Visualizer is a client-side web application that allows users to track personal expenses, categorize spending, and visualize their budget distribution through an interactive pie chart. The app runs entirely in the browser using HTML, CSS, and Vanilla JavaScript, with all data persisted via the browser's Local Storage API. No backend server or build toolchain is required.

The app targets individuals who want a lightweight, zero-setup tool to monitor daily spending across categories such as Food, Transport, and Fun — with optional support for custom categories, monthly summaries, sorting, spending limit alerts, and a dark/light mode toggle.

---

## Glossary

- **App**: The Expense Budget Visualizer web application.
- **Transaction**: A single expense entry consisting of an item name, amount, and category.
- **Category**: A label grouping transactions (e.g., Food, Transport, Fun, or a user-defined custom category).
- **Transaction_List**: The scrollable UI component that displays all recorded transactions.
- **Input_Form**: The UI form component used to enter a new transaction.
- **Balance_Display**: The UI component at the top of the page showing the total sum of all transaction amounts.
- **Pie_Chart**: The visual chart component showing spending distribution by category.
- **Local_Storage**: The browser's built-in `localStorage` API used for client-side data persistence.
- **Spending_Limit**: A user-defined threshold amount above which spending in a category is highlighted.
- **Monthly_Summary**: A filtered view showing only transactions from a selected calendar month.
- **Theme**: The visual color scheme of the App, either light or dark.

---

## Requirements

### Requirement 1: Transaction Input

**User Story:** As a user, I want to enter expense details through a form, so that I can record my spending quickly.

#### Acceptance Criteria

1. THE Input_Form SHALL include a text field for item name (maximum 100 characters), a numeric field for amount, and a dropdown selector for category.
2. WHEN the user submits the Input_Form with all fields filled, a valid positive amount between 0.01 and 9,999,999.99, and a selected category, THE App SHALL add the transaction to the Transaction_List and persist it to Local_Storage.
3. IF the user submits the Input_Form with one or more empty fields, THEN THE Input_Form SHALL display an inline validation error message adjacent to each empty field indicating that the field is required.
4. IF the user enters a non-positive or non-numeric value in the amount field, THEN THE Input_Form SHALL display an inline validation error message adjacent to the amount field stating that the amount must be a positive number.
5. IF the user enters an amount greater than 9,999,999.99 in the amount field, THEN THE Input_Form SHALL display an inline validation error message adjacent to the amount field stating that the amount exceeds the maximum allowed value.
6. WHEN a transaction is successfully added, THE Input_Form SHALL reset all fields to their default empty/unselected placeholder state.

---

### Requirement 2: Transaction List

**User Story:** As a user, I want to see all my recorded transactions in a list, so that I can review my spending history.

#### Acceptance Criteria

1. THE Transaction_List SHALL display all stored transactions, each showing the item name, amount, and category.
2. IF the number of transactions exceeds the visible area of the Transaction_List container, THEN THE Transaction_List SHALL be scrollable to reveal all items.
3. WHEN the user clicks the delete control on a transaction, THE App SHALL immediately remove that transaction from the Transaction_List and from Local_Storage.
4. WHEN the App loads in the browser and Local_Storage contains valid transaction data, THE Transaction_List SHALL populate with all transactions previously saved in Local_Storage. IF Local_Storage is empty or contains malformed data, THEN THE Transaction_List SHALL display an empty state.
5. THE Transaction_List SHALL display transactions in newest-first order by default (most recently added transaction appears at the top).

---

### Requirement 3: Total Balance Display

**User Story:** As a user, I want to see my total spending at a glance, so that I can understand my overall budget consumption.

#### Acceptance Criteria

1. THE Balance_Display SHALL show the sum of all transaction amounts currently in the Transaction_List, rounded to 2 decimal places.
2. WHEN the Transaction_List is empty, THE Balance_Display SHALL show 0.00.
3. WHEN a transaction is added, THE Balance_Display SHALL update to reflect the new total within 1 second without requiring a page reload.
4. WHEN a transaction is deleted, THE Balance_Display SHALL update to reflect the new total within 1 second without requiring a page reload.

---

### Requirement 4: Pie Chart Visualization

**User Story:** As a user, I want to see a pie chart of my spending by category, so that I can understand where my money is going.

#### Acceptance Criteria

1. THE Pie_Chart SHALL display each category as a visually distinct segment (differentiated by color) sized proportionally to the total amount spent in that category relative to all transactions.
2. THE Pie_Chart SHALL include a legend that labels each segment with its category name and the corresponding percentage or amount.
3. WHEN a transaction is added, THE Pie_Chart SHALL update automatically within 1 second to reflect the new spending distribution.
4. WHEN a transaction is deleted, THE Pie_Chart SHALL update automatically within 1 second to reflect the revised spending distribution.
5. WHEN the Transaction_List is empty, THE Pie_Chart SHALL display a placeholder state (e.g., a message such as "No data available") in place of the chart segments.

---

### Requirement 5: Data Persistence

**User Story:** As a user, I want my transactions to be saved between sessions, so that I do not lose my data when I close or refresh the browser.

#### Acceptance Criteria

1. WHEN a transaction is added, THE App SHALL write the updated transaction list to Local_Storage.
2. WHEN a transaction is deleted, THE App SHALL write the updated transaction list to Local_Storage.
3. WHEN the App initializes and Local_Storage contains valid transaction data, THE App SHALL read all transactions from Local_Storage and restore the Transaction_List, Balance_Display, and Pie_Chart to their last saved state. IF Local_Storage is empty on first load, THE App SHALL initialize with an empty Transaction_List, a Balance_Display of 0.00, and the Pie_Chart placeholder state.
4. IF Local_Storage contains corrupt or unparseable transaction data when the App initializes, THEN THE App SHALL discard the corrupt data, initialize with an empty state, and continue operating normally.

---

### Requirement 6: Custom Categories

**User Story:** As a user, I want to create my own spending categories, so that I can track expenses that do not fit the default categories.

#### Acceptance Criteria

1. THE Input_Form SHALL provide a text input field for the user to enter a custom category name (1–30 characters) in addition to selecting from the default categories (Food, Transport, Fun).
2. WHEN the user submits a custom category name that is between 1 and 30 characters and does not duplicate an existing category name (case-insensitive), THE App SHALL add that category to the category selector and make it available for future transactions.
3. IF the user submits a custom category name that is empty, exceeds 30 characters, or duplicates an existing category name (case-insensitive), THEN THE App SHALL reject the submission and display a validation error indicating the reason.
4. THE App SHALL persist custom categories to Local_Storage so that they are available after a page reload.
5. WHEN a custom category is in use by one or more transactions, THE Pie_Chart SHALL display a segment labeled with the custom category name alongside the default categories.

---

### Requirement 7: Monthly Summary View

**User Story:** As a user, I want to filter my transactions by month, so that I can review my spending for a specific time period.

#### Acceptance Criteria

1. THE App SHALL provide a month/year selector control (supporting years from 2000 to the current year) that filters the Transaction_List to show only transactions recorded in the selected month and year. WHEN the App loads, THE month/year selector SHALL default to the current month and year.
2. WHEN a month/year is selected, THE Balance_Display SHALL reflect the total of only the filtered transactions.
3. WHEN a month/year is selected, THE Pie_Chart SHALL reflect the spending distribution of only the filtered expense transactions for that month and year.
4. WHEN the user clears the month/year filter, THE App SHALL restore the Transaction_List, Balance_Display, and Pie_Chart to show all transactions with no filter applied.
5. WHEN a transaction is added, THE App SHALL record the current date and time as the transaction timestamp.
6. WHEN a month/year is selected and no transactions exist for that period, THE Transaction_List SHALL display an empty state message, THE Balance_Display SHALL show 0.00, and THE Pie_Chart SHALL display its placeholder state.

---

### Requirement 8: Transaction Sorting

**User Story:** As a user, I want to sort my transactions, so that I can find and compare entries more easily.

#### Acceptance Criteria

1. THE Transaction_List SHALL provide a sort control with options: None (insertion order, default), Amount Ascending, Amount Descending, Category A–Z, and Category Z–A.
2. WHEN the user selects a sort option, THE Transaction_List SHALL reorder the displayed transactions according to the selected criterion without modifying the stored order in Local_Storage. When two transactions have equal sort values, they SHALL be ordered by insertion order (oldest first) as a tie-breaker. WHEN the App reloads, THE sort control SHALL reset to None (insertion order).
3. WHEN a new transaction is added while a sort option other than None is active, THE Transaction_List SHALL insert the new transaction in the correct sorted position according to the active sort criterion.
4. WHEN no sort option is active (None selected), THE Transaction_List SHALL append new transactions to the top of the list (newest-first insertion order).

---

### Requirement 9: Spending Limit Highlight

**User Story:** As a user, I want to set a spending limit and be alerted when I exceed it, so that I can stay within my budget.

#### Acceptance Criteria

1. THE App SHALL provide an input control for the user to set a numeric Spending_Limit that must be a positive number greater than zero.
2. IF the user submits a non-positive or non-numeric value as the Spending_Limit, THEN THE App SHALL display a validation error message and not update the Spending_Limit.
3. WHEN a Spending_Limit has been set and the total amount of all transactions exceeds the Spending_Limit, THE Balance_Display SHALL apply a persistent warning indicator (visually distinct from the default style, e.g., a red color or warning icon) to signal that the limit has been exceeded.
4. WHEN the total amount of all transactions is at or below the Spending_Limit, THE Balance_Display SHALL display in its default style.
5. THE App SHALL persist the Spending_Limit value to Local_Storage so that it is restored after a page reload, and the highlight state SHALL be re-evaluated immediately after the Spending_Limit is restored.

---

### Requirement 10: Dark/Light Mode Toggle

**User Story:** As a user, I want to switch between dark and light themes, so that I can use the app comfortably in different lighting conditions.

#### Acceptance Criteria

1. THE App SHALL provide a toggle control that switches the Theme between light mode and dark mode.
2. WHEN the user activates the toggle, THE App SHALL apply the selected Theme to all visible UI components within 300ms without a page reload.
3. WHEN the user activates the toggle, THE App SHALL persist the selected Theme preference to Local_Storage.
4. WHEN the App initializes and a Theme preference is stored in Local_Storage, THE App SHALL restore and apply that stored Theme.
5. WHEN the App initializes and no Theme preference is stored in Local_Storage, THE App SHALL default to the light Theme.
6. IF Local_Storage is unavailable when the App initializes, THEN THE App SHALL default to the light Theme and continue operating normally without persisting the Theme preference.
