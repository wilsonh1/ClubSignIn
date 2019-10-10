# ClubSignIn

Facebook chatbot for signing into clubs.

## Setup
+ Spreadsheet format [example](https://docs.google.com/spreadsheets/d/1vxTdHjnw58ji-yeZ-KStYa4xDj58cEcR1s1ya2Lhyig/edit?usp=sharing)

## Usage
+ Heroku CLI
1. Updating the sign in key
    ```bash
    heroku config:set --app=club-sign-in SIGNIN_KEY=[key]
    ```
2. Setting next column in points spreadsheet
    ```bash
    heroku config:set --app=club-sign-in SHEET_NXTCOL=[col]
    ```
3. Updating spreadsheet
    ```bash
    heroku run --app=club-sign-in node sheets.js
    ```
