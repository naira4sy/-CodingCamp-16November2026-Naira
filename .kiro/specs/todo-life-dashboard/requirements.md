# Requirements Document

## Introduction

The To Do List Life Dashboard is a client-side web application that helps users manage daily tasks and broader life activities in one organised, visually appealing interface. It runs entirely in the browser using HTML, CSS, and Vanilla JavaScript, with all data persisted in the browser's Local Storage. No backend server, build tools, or external frameworks are required.

## Glossary

- **Dashboard**: The single-page web application that displays all task lists and life activity panels.
- **Task**: An individual action item with a title, optional due date, and a completion status.
- **Task_List**: A named, user-created group of Tasks (e.g. "Work", "Shopping", "Fitness").
- **Life_Category**: A high-level organisational label (e.g. Health, Finance, Personal) that groups one or more Task_Lists.
- **Storage**: The browser's `localStorage` API used to persist all application data client-side.
- **UI**: The visible interface elements rendered in the browser.
- **Filter**: A user-selected criterion that limits which Tasks are displayed.
- **Progress_Indicator**: A visual element (e.g. progress bar or percentage) showing the ratio of completed Tasks within a Task_List or Life_Category.

---

## Requirements

### Requirement 1: Task Creation

**User Story:** As a user, I want to add new tasks to any task list, so that I can capture and track things I need to do.

#### Acceptance Criteria

1. WHEN a user submits a non-empty task title of 1 to 255 characters, THE Dashboard SHALL add a new Task to the specified Task_List and display it in the Task_List within 1 second without a page reload.
2. IF a user submits an empty task title or a task title exceeding 255 characters, THEN THE Dashboard SHALL prevent the Task from being created and display an inline validation message indicating the title requirement.
3. WHEN a user provides an optional due date during task creation, THE Dashboard SHALL accept only calendar dates in YYYY-MM-DD format and store and display the due date alongside the Task title.
4. IF a user provides a due date that is not a valid calendar date or uses a format other than YYYY-MM-DD, THEN THE Dashboard SHALL prevent the Task from being created and display an inline validation message indicating the expected date format.
5. THE Dashboard SHALL allow a user to assign a Task to exactly one Task_List at the time of creation.
6. IF no Task_List exists when a user attempts to create a Task, THEN THE Dashboard SHALL prevent Task creation and display a message indicating that at least one Task_List must exist before adding Tasks.

---

### Requirement 2: Task Completion and Status Management

**User Story:** As a user, I want to mark tasks as complete or incomplete, so that I can track my progress through the day.

#### Acceptance Criteria

1. WHEN a user marks a Task as complete, THE Dashboard SHALL update the Task's status to completed and display the Task with its text struck through and its completion control in a checked state.
2. WHEN a user marks a completed Task as incomplete, THE Dashboard SHALL restore the Task's status to active, remove the strikethrough from the Task's text, and return its completion control to an unchecked state.
3. WHEN the completion status of any Task changes, THE Dashboard SHALL update the Progress_Indicator for the containing Task_List within 100 milliseconds.
4. THE Dashboard SHALL preserve the completion status of all Tasks across browser sessions with no expiry, using Storage, until the Task is explicitly deleted.
5. IF Storage is unavailable when a completion status change occurs, THEN THE Dashboard SHALL retain the updated completion status for the current session and display an error indicating that the change will not be saved across sessions.

---

### Requirement 3: Task Editing and Deletion

**User Story:** As a user, I want to edit and delete tasks, so that I can keep my lists accurate as my priorities change.

#### Acceptance Criteria

1. WHEN a user initiates an edit on a Task, THE Dashboard SHALL display the Task's current title and due date in an editable form inline, with the title field accepting up to 255 characters.
2. WHEN a user saves an edited Task with a non-empty title, THE Dashboard SHALL update the Task in the UI and in Storage within 2 seconds.
3. IF a user saves an edited Task with an empty title, THEN THE Dashboard SHALL prevent the save and display an inline validation message indicating the title is required.
4. IF Storage fails to persist a saved edit, THEN THE Dashboard SHALL display an error message indicating the save failed and retain the editable form with the user's unsaved changes.
5. WHEN a user deletes a Task, THE Dashboard SHALL display a confirmation prompt before removing the Task.
6. WHEN a user confirms deletion, THE Dashboard SHALL remove the Task from the UI and from Storage within 2 seconds without requiring a page reload.
7. IF Storage fails to persist a deletion, THEN THE Dashboard SHALL display an error message indicating the deletion failed and restore the Task in the UI.

---

### Requirement 4: Task List Management

**User Story:** As a user, I want to create, rename, and delete task lists, so that I can organise my tasks into meaningful groups.

#### Acceptance Criteria

1. WHEN a user creates a Task_List with a non-empty name of at most 100 characters, THE Dashboard SHALL add the Task_List to the UI and persist it in Storage.
2. IF a user creates a Task_List with an empty name, THEN THE Dashboard SHALL prevent creation and display an inline validation message.
3. WHEN a user renames a Task_List with a non-empty name of at most 100 characters, THE Dashboard SHALL update the displayed name in the UI and in Storage within 100 milliseconds.
4. IF a user renames a Task_List with an empty name, THEN THE Dashboard SHALL prevent the rename and display an inline validation message.
5. WHEN a user requests deletion of a Task_List, THE Dashboard SHALL prompt the user to confirm before proceeding, and upon confirmation SHALL remove the Task_List and all of its Tasks from the UI and from Storage.
6. THE Dashboard SHALL allow a user to assign each Task_List to exactly one Life_Category, and SHALL require a Life_Category to be selected before the Task_List is persisted.

---

### Requirement 5: Life Category Organisation

**User Story:** As a user, I want to group my task lists under life categories, so that I can see how my tasks relate to different areas of my life.

#### Acceptance Criteria

1. WHEN the Dashboard loads, THE Dashboard SHALL display each Task_List grouped under its assigned Life_Category, with each group labelled by the Life_Category name.
2. WHEN the Dashboard loads, THE Dashboard SHALL display any Task_List that has no assigned Life_Category under a section labelled "Uncategorised".
3. WHEN a user creates a Life_Category with a name between 1 and 50 characters, THE Dashboard SHALL add it to the UI and persist it in Storage.
4. IF a user creates a Life_Category with an empty name or a name exceeding 50 characters, THEN THE Dashboard SHALL prevent creation and display an inline validation message indicating the name requirement.
5. WHEN a user requests deletion of a Life_Category that contains Task_Lists, THE Dashboard SHALL prompt the user to confirm that all contained Task_Lists and their Tasks will also be permanently deleted.
6. WHEN a user confirms deletion of a Life_Category, THE Dashboard SHALL remove the Life_Category, all its Task_Lists, and all Tasks within those Task_Lists from both the UI and Storage.
7. THE Dashboard SHALL provide the following built-in Life_Categories by default: Personal, Work, Health, Finance; these built-in categories SHALL NOT be deletable or renameable by the user.

---

### Requirement 6: Progress Tracking

**User Story:** As a user, I want to see visual progress indicators for each task list and life category, so that I can quickly gauge how much I have accomplished.

#### Acceptance Criteria

1. THE Dashboard SHALL display a Progress_Indicator for each Task_List showing the percentage of completed Tasks out of total Tasks.
2. THE Dashboard SHALL display a Progress_Indicator for each Life_Category showing the percentage of completed Tasks across all Task_Lists within that category.
3. WHEN a Task_List contains zero Tasks, THE Dashboard SHALL display the Progress_Indicator at 0% without arithmetic errors.
4. WHEN the number of completed Tasks in a Task_List changes, THE Dashboard SHALL recalculate and re-render the Task_List Progress_Indicator within 100 milliseconds.

---

### Requirement 7: Task Filtering and Sorting

**User Story:** As a user, I want to filter and sort tasks within a list, so that I can focus on what is most relevant at any moment.

#### Acceptance Criteria

1. WHEN a user applies the "Active" Filter, THE Dashboard SHALL display only Tasks with an incomplete status in the selected Task_List.
2. WHEN a user applies the "Completed" Filter, THE Dashboard SHALL display only Tasks with a completed status in the selected Task_List.
3. WHEN a user applies the "All" Filter, THE Dashboard SHALL display all Tasks in the selected Task_List regardless of status.
4. WHEN a user selects "Sort by Due Date", THE Dashboard SHALL order Tasks within the visible list from the earliest due date to the latest, with Tasks that have no due date placed at the end.
5. WHEN a user selects "Sort by Creation Date", THE Dashboard SHALL order Tasks within the visible list from oldest to newest.

---

### Requirement 8: Data Persistence

**User Story:** As a user, I want my data to be saved automatically, so that I never lose my tasks when I close or refresh the browser.

#### Acceptance Criteria

1. WHEN any Task, Task_List, or Life_Category is created, modified, or deleted, THE Dashboard SHALL write the updated state to Storage before the operation's UI change is rendered to the user.
2. WHEN the Dashboard loads, THE Dashboard SHALL read all data from Storage and restore the complete previous state of all Life_Categories, Task_Lists, and Tasks.
3. IF Storage is unavailable or returns a parse error on load, THEN THE Dashboard SHALL display a non-blocking warning message and initialise with an empty state.
4. THE Dashboard SHALL store all application data under a single namespaced key in Storage to avoid conflicts with other browser-stored data.

---

### Requirement 9: Responsive Layout

**User Story:** As a user, I want the dashboard to look good on different screen sizes, so that I can use it on my desktop, tablet, or mobile device.

#### Acceptance Criteria

1. THE Dashboard SHALL render a usable, unclipped layout at viewport widths from 320 px to 2560 px.
2. WHEN the viewport width is below 768 px, THE Dashboard SHALL stack Life_Category panels vertically and display a single-column Task_List layout.
3. WHEN the viewport width is 768 px or above, THE Dashboard SHALL display Life_Category panels in a multi-column grid layout.
4. THE Dashboard SHALL use relative units (rem, %, vw) for font sizes and layout dimensions so that text scales with the user's browser font-size setting.

---

### Requirement 10: Accessibility and Readability

**User Story:** As a user, I want the interface to be clear and readable, so that I can use it comfortably without strain.

#### Acceptance Criteria

1. THE Dashboard SHALL apply a minimum body font size of 16 px and a minimum line-height of 1.5 for Task and label text.
2. THE Dashboard SHALL maintain a contrast ratio of at least 4.5:1 between text and its background colour for all Task titles and UI labels, in accordance with WCAG 2.1 Level AA.
3. THE Dashboard SHALL provide visible focus indicators on all interactive elements (buttons, inputs, checkboxes) so that keyboard-only users can navigate the UI.
4. THE Dashboard SHALL include descriptive `aria-label` attributes on icon-only buttons so that screen readers can announce their purpose.

---

### Requirement 11: Performance

**User Story:** As a user, I want the dashboard to load quickly and respond instantly to my actions, so that it does not slow down my workflow.

#### Acceptance Criteria

1. THE Dashboard SHALL complete its initial render, including restoration of all stored data, within 1 second on a modern browser with a cold cache on a standard consumer device.
2. WHEN a user performs any single UI action (add, complete, delete, filter), THE Dashboard SHALL reflect the change in the UI within 100 milliseconds.
3. THE Dashboard SHALL produce no JavaScript console errors during normal operation on Chrome, Firefox, Edge, and Safari.

---

### Requirement 12: Browser Compatibility

**User Story:** As a developer, I want the application to work across all major modern browsers, so that users are not restricted to a specific browser.

#### Acceptance Criteria

1. THE Dashboard SHALL function without errors or layout breakage on the latest stable releases of Chrome, Firefox, Edge, and Safari.
2. THE Dashboard SHALL use only Web APIs available without polyfills in the browsers listed in Acceptance Criteria 1 (including `localStorage`, CSS Grid, CSS Flexbox, and ES2020 JavaScript).
3. THE Dashboard SHALL be deliverable as a single self-contained `index.html` file or as a directory of static files that can be opened directly from the filesystem without a local server.
