const GoogleAuth = require('google-auth-library');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

const key = "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDExU6Jsdy6G7TH\nLuebzZp/fknAePwlh6fy8GRwCuBTwQzKrpmBNPFcuVc/V4HiOkNP4d36gQnqi9dF\n2psRpx09rW9LAyrQCtDUG6PhZXVXJDb3NLiQNSYA4FCCDFKsPTqK49oEk85y5cvj\nwpaSp3pLXP0fzMp6qpOVe5gkOVkdfH1wz1ILvD9XrgSSn3P3lJnvFEKkaylAnyCc\nDUji+8e0/XhZL2BBAzwIZcqSzkCAgXnwrlAtsm+ievPJS0S+uezQ3KjP7kK1hcbc\nCHmDsHxDaZ3ZjTmfgeOZWzvM6C/ASVkRjB8dSoyt9Q9DAOnAPQcu6Vi2PciCcjg7\nyx/G8RmRAgMBAAECggEAFe9HOiEAQaRTRoVvZt44b+gqbUjnVcEtqw6aaaWCvH9n\nj0P/o2g9FCiqhcp51XfId2QOsE04Z2OblaNA+EqsXyrhXket+vdLsGtc3URHvHUy\nZeQEA3pTQFOBEgAw6pegOimcbPhzkfoVHJB9Y7+E6dgFtQjplNtFPKuEihw094zu\nIA0jaZFB+ijqulOxbP3bvLVAEDaZ3MKewAhxxAaMXXAzQWkUn22k8/r6lLEFC0nk\nmgB6TeJ1fvNlhYEpOzHMojw6bI5YgY+j6/Sv4dCWuTlSNBvj+mLo6VaodMO3clSc\nhV23cxNzoXHn9EbV+8cwzpIOHAAX5ZAiL5rRYahniQKBgQDrUCfj35+TehTSI7rH\nkMaIXaV+yxnw4jFDwqTRxxij0BQaG/UIw4veu1v1kuQzcYP7o7IU+YhJo45nlwv8\nSR0ep6I9NxttbwcsL0mG6OV3qQKmOdPTnCTOqaqWjbmbaVxwPvCLfCNKR+oT5EIE\nIuugDs1u9FnbPRAeOUZEqrraeQKBgQDWEbwRErAUoSI3sanIIEYkt0hFbeIPwZoA\nYD7Leyvt+pvXPgkD65Ml02zHPonkrhFRSyorL5UfAzdKyBrAtrfyU7iJrcuSrYrE\nwZm8IxDoKi4maUDYDOPao/RD530rjPqx2iV+SamfvnblThl98dT7DF40j22ItInD\npEiThXLx2QKBgQCZPKudc2UBrwCcD/R0PU1sRD+foDeWbFZUoA6hJZxgIQLWNdqO\nCHmvZCdwdmXxMj0Ww/UWP6GHAuGbh/ugISS7b8LxRk+wJhtvpKOnHUdBc2hsQ0A0\nj3xQsKCMRmLWV/iAiBwxWXfJyacfqQdslikHJFyXorxZTxyN8hJWaTAhUQKBgQCd\n+paNDvqNLuEesul2PIMnY29ddZtIP3sUXfLZnfusc68AqNJkZzy/xIjZfYisD93N\n3aewGTx2l5v9fzFnGTElD633RSAgDhyD2dBHrKU0gLRwOmrVRqX829RPLI4OTstP\n54qV6WzZ6+i4jut3K7oez2DSbyrJoVqt3BaHcAuE+QKBgFlzi/X1u4jysqo8tX3c\naYTW5iCXXqyU2j3HMm11V8MDek7JF8c/8d4dV4ewkMtobQaQC6MwmUvQaky/Bsd8\nSJC4JY1tAUum7Wh20+86xqX9HMNi7BIWWwicWL1o7N8ZoiF8QHscgm4IT/iC3E+Y\nteIqmT73XrT87UKoAOR0iorj\n-----END PRIVATE KEY-----\n";

function authorize() {
    return new Promise(resolve => {
        const authFactory = new GoogleAuth();
        const jwtClient = new authFactory.JWT(
            "sheettest@quickstart-1569797701892.iam.gserviceaccount.com",
            null,
            key.replace(/\\n/g, '\n'),
            SCOPES
        );
        jwtClient.authorize(() => resolve(jwtClient));
    });
}

module.exports = {
    authorize
}
