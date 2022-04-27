# cfisd-api (UNOFFICIAL)
An api for getting your grades. Made using puppeteer and sqlite3

Test it out<br/>
[https://cfisd-api.glitch.me/](https://cfisd-api.glitch.me)

**Please note:**<br/>
Grades are cached in the server for up to 5 hours to speed up performance and app usability, after which they will be updated at next login. Your username and password are stored to verify your identity, but your password is salted and hashed in the database to prevent misuse of your login credentials. The code is published here and on [glitch](https://glitch.com/edit/#!/cfisd-api) (the actual running version) for those who would like to take a look at it.

## The API

### GET /grades
`https://cfisd-api.glitch.me/api/grades?username=<username>&password=<password>`

Sample Cache Response:

```js
{
  "success":true,
  "update":false,
  "data": [
    {"grade":"99 ","course":"English I"},
    {"grade":"99 ","course":"Geometry"},
    {"grade":"99 ","course":"BAND II"},
    {"grade":"99","course":"COMP SCI I"},
    {"grade":"99 ","course":"Spanish I"},
    {"grade":"99 ","course":"PACE"},
    {"grade":"99 ","course":"BIOLOGY"}
  ],
  "age":1698236
}
```

Get the grades for specified user. Incorrect login credentials will supply an error.

## Disclaimer
I can not gaurantee that this service will work 100% of the time. As stated above it is unofficial, so use it at your own risk. If you use this api to get grades for your users, please take the proper measures to secure the logins of your users. I am not responsible if any logins are leaked or exposed due to a flaw in your app. Just play nice.
