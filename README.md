# ClubSignIn

Facebook chatbot for signing into clubs.

## Setup

## Usage
+ Heroku CLI
 1. Updating the sign in key
    ```bash
    heroku config:set --app=club-sign-in SIGNIN_KEY=[key]
    ```
 2. Set next column in points spreadsheet
    ```bash
    heroku config:set --app=club-sign-in SHEET_NXTCOL=[col]
    ```
 3. Update spreadsheet
    ```bash
    heroku run --app=club-sign-in node sheets.js
    ```
