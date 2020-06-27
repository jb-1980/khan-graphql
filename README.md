# khan-graphql

Helper methods to get your data from Khan Academy

## The problem

Khan Academy [shut down their API](https://github.com/Khan/khan-api), leaving you wondering how you could continue
to keep your student data in sync between your LMS and Khan Academy.

#### This isn't...

This is not like the full Khan API. It is not meant for use in user facing environments.

#### This is..

If you need to get your data from Khan Academy using a backend service, this is for you.

## Setup

This is run on Node. It uses `axios` to log into Khan Academy, and stores the cookies with `tough-cookie` and `axios-cookiejar-support`. Once
authenticated, you should be able to get various data through the `/api/internal/graphql` endpoints.

install with

```
npm i --save khan-graphql
```

## Usage

```javascript
const { KhanApi } = require("khan-graphql")

const CREDS = {
  identifier: "your coach account",
  password: "your password",
}

const main = async () => {
  let kapi = new KhanApi()

  // always authenticate before retrieving data
  await kapi.authenticate(CREDS.identifier, CREDS.password)

  // now that we are authenticated, we can retrieve data. Let's get the coach data
  // with a helper method
  let data = await kapi
    .getCoach()
    .then((res) => res.data)
    .catch((err) => console.error(err))

  console.log({ data: JSON.stringify(data, null, 2) })

  // or inspect the network calls in Chrome dev tools while on Khan Academy to find
  // another endpoint, and use that. See CONTRIBUTING.md for more details

  let payload = {
    operationName: "getClassList",
    variables: {},
    query:
      "query getClassList {\n  coach {\n    id\n    joined\n    studentLists: coachedStudentLists {\n      name\n      id\n      cacheId\n      key\n      topics {\n        id\n        slug\n        title: translatedTitle\n        iconPath\n        domainSlug\n        learnableContentSummary {\n          countExercises\n          __typename\n        }\n        __typename\n      }\n      autoGenerated\n      countStudents\n      topicTitle\n      classroomDistrictInfo {\n        id\n        isNweaMapSynced\n        __typename\n      }\n      __typename\n    }\n    demoClassProgress {\n      completed\n      selectedTopics {\n        id\n        slug\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n  user {\n    id\n    tosForFormalTeacherStatus\n    schoolAffiliation {\n      id\n      name\n      postalCode\n      location\n      __typename\n    }\n    affiliationCountryCode\n    __typename\n  }\n}\n",
  }
  let customData = await kapi.getGraphQL("/getClassList", payload)

  console.log({ customData })
}

main()
```

## Contributing

I would gladly welcome any contributers to this project. There are many GraphQL endpoints on Khan Academy, with some great data.
I would like to get some wrapper around those to make it easier to users to find
their students' data.

Please see CONTRIBUTING.md for ideas on how you can help.
