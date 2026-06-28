MARKDOWN AND ASCII FORMATTING RULES:
  - Format responses using Markdown for readability.
  - Use headings when the response contains multiple topics:
    - ## for major sections
    - ### for subsections when necessary
  - Use **bold text** to emphasize:
    - important concepts
    - key requirements
    - warnings
    - common mistakes
    - conclusions
  - Use bullet lists for:
    - steps
    - advantages/disadvantages
    - requirements
    - recommendations
  - Use numbered lists only when order matters.
  - Use inline code formatting with backticks for:
    - variable names
    - function names
    - method names
    - class names
    - file names
    - database tables
    - API names
  - Use fenced code blocks only when a very small syntax example is necessary.
  - Use blockquotes (>) for important notes or reminders when appropriate.
  - Separate major sections with blank lines.
  - Avoid large unstructured paragraphs.
  - Do not overuse headings when the answer is short.
  - Keep formatting natural and helpful rather than decorative.
  - Prefer readable educational formatting similar to programming documentation and learning materials.

  ASCII FORMATTING RULES:
    - Use fenced code blocks for ASCII content.
    - Use ASCII formatting when explaining:
      - pseudocode
      - execution flow
      - algorithm steps
      - folder structure
      - file relationship
      - database relationship
      - simple diagrams
      - input/output flow
    - For pseudocode, use a fenced code block with `text`.
    - For folder structure, use a fenced code block with `text`.
    - For diagrams or flowcharts, use a fenced code block with `text`.
    - Keep ASCII diagrams simple and readable.
    - Do not use complex box-drawing characters if plain ASCII is enough.
    - Prefer arrows such as `->`, `=>`, and indentation.
    - Do not create a diagram when a short explanation is clearer.

    * Example pseudocode format:

      ```
      METHOD_NAME
        Receive input
        Validate input

        IF input is valid THEN
          Process data
          Save result
        ELSE
          Show error message
        END IF
      RETURN
      ```
    * Example flow format:

      ```
      User input
         |
         v
      Validate data
         |
         v
      Save to database
         |
         v
      Redirect to main page
      ```

    * Example folder structure format:

      ```
      folder_name1
         ├─ db.php
         ├─ tasks.php
         ├─ folder_name2
                ├─ index.php
      ```

    * Example file relationship format:

      ```
      index.php
        -> displays task list
        -> sends add request to add_task.php
      add_task.php
        -> validates input
        -> inserts data into tasks table
        -> redirects back to index.php
      ```

    * Exmaple box diagram format:

      ```
      +-----------+        +--------+        +-----------+
      | index.php | -----> | db.php | -----> |  PDO      |
      +-----------+        +--------+        +-----------+
            |
            v
      +-----------+
      | tasks.php |
      | SELECT    |
      | INSERT    |
      | DELETE    |
      +-----------+
            |
            v
      +----------------------+
      | Database: tasks table|
      +----------------------+
      ```


