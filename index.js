const axios = require("axios")
const tough = require("tough-cookie")
const axiosCookieJarSupport = require("axios-cookiejar-support").default

axiosCookieJarSupport(axios)

const cookieJar = new tough.CookieJar()
axios.defaults.jar = cookieJar
axios.defaults.withCredentials = true

const BASE_URL = "https://www.khanacademy.org"
const loginUrl = `${BASE_URL}/login`

exports.KhanApi = class {
  authenticated = false
  authenticate = async (identifier, password) =>
    axios({
      url: loginUrl,
      method: "post",
      data: `identifier=${encodeURIComponent(
        identifier
      )}&password=${encodeURIComponent(password)}`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    }).then((res) => {
      if (res.data.error) {
        throw new Error(res.data.error)
      }
      this.authenticated = true
      return true
    })

  // helper methods to wrap axios
  axios() {
    return axios(...arguments)
  }
  get() {
    return axios.get(...arguments)
  }
  post() {
    return axios.post(...arguments)
  }

  // helper method to wrap calls to graphQL
  graphQL = async (endpoint, payload, method = "POST") => {
    let url = `${BASE_URL}/api/internal/graphql${endpoint}`
    return method === "POST" ? this.post(url, payload) : this.get(url, payload)
  }

  /*************** ADD AND MAINTAIN METHODS BELOW *****************************/
  /* Discover methods by looking at the network tab in devtools when visiting a
   * page in Khan Academy. Add the payload values as an object, and then you can
   * fetch the data using this.graphQL
   */

  getCoach = async () => {
    let payload = {
      operationName: "getCoach",
      query:
        "query getCoach {\n  coach {\n    id\n    nickname\n    __typename\n  }\n  countries {\n    id\n    code\n    translatedName\n    __typename\n  }\n  user {\n    id\n    tosForFormalTeacherStatus\n    schoolAffiliation {\n      id\n      name\n      postalCode\n      location\n      __typename\n    }\n    affiliationCountryCode\n    __typename\n  }\n}\n",
      variables: {},
    }
    return this.graphQL("/getCoach", payload)
  }

  ProgressByStudent = async (classId, pageSize = 1000) => {
    let payload = {
      operationName: "ProgressByStudent",
      variables: {
        classId,
        pageSize,
        assignmentFilters: { dueAfter: null, dueBefore: null },
        contentKinds: null,
        after: null,
      },
      query:
        "query ProgressByStudent($assignmentFilters: CoachAssignmentFilters, $contentKinds: [LearnableContentKind], $classId: String!, $pageSize: Int, $after: ID) {\n  coach {\n    id\n    studentList(id: $classId) {\n      id\n      cacheId\n      studentKaidsAndNicknames {\n        id\n        coachNickname\n        __typename\n      }\n      assignmentsPage(filters: $assignmentFilters, after: $after, pageSize: $pageSize) {\n        assignments(contentKinds: $contentKinds) {\n          id\n          dueDate\n          contents {\n            id\n            translatedTitle\n            kind\n            defaultUrlPath\n            __typename\n          }\n          itemCompletionStates: itemCompletionStatesForAllStudents {\n            completedOn\n            studentKaid\n            bestScore {\n              numAttempted\n              numCorrect\n              __typename\n            }\n            __typename\n          }\n          __typename\n        }\n        pageInfo {\n          nextCursor\n          __typename\n        }\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}\n",
    }

    return this.graphQL("/ProgressByStudent", payload)
  }
}
