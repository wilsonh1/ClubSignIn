# ClubSignIn

Messenger bot for signing into clubs.

## Setup
+ Spreadsheet format [example](https://docs.google.com/spreadsheets/d/1vxTdHjnw58ji-yeZ-KStYa4xDj58cEcR1s1ya2Lhyig/edit?usp=sharing)
    + Order of columns is important
    + Sheet name must be "Points"

## Usage
+ Heroku CLI
    1. Update sign in key
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

+ Manually adding members
    1. Create a new document on mongoDB
        + `user_id` must be unique
        + Set `first` to `true`
    2. Points must be updated on mongoDB
    2. Updating the spreadsheet will create new rows automatically

+ **Note:** Previous sign ins are not stored, and sign ins are not separated by week
    + To accurately track meetings, the spreadsheet must be updated before the next meeting
    + Do not use the same key for multiple meetings  
