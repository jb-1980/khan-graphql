const axios = require("axios")
const tough = require("tough-cookie")
const axiosCookieJarSupport = require("axios-cookiejar-support").default

axiosCookieJarSupport(axios)

const cookieJar = new tough.CookieJar()
axios.defaults.jar = cookieJar
axios.defaults.withCredentials = true

const BASE_URL = "https://www.khanacademy.org"

exports.KhanApi = class {
  constructor() {
    this.authenticated = false
    this.user = null
  }

  authenticate = async (identifier, password) =>
    this.loginWithPasswordMutation({ identifier, password })
      .then(async (res) => {
        let data = res.data.data.loginWithPassword
        if (data.error) {
          if (data.error.code == "ALREADY_LOGGED_IN") {
            this.authenticated = true
            return this.user
          }
          throw Error(data.error)
        }
        this.authenticated = true
        this.user = data.user
        return data.user
      })
      .catch((err) => {
        this.authenticated = false
        throw Error(err)
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
  loginWithPasswordMutation = ({ identifier, password }) => {
    let payload = {
      operationName: "loginWithPasswordMutation",
      variables: { identifier, password },
      query: "mutation loginWithPasswordMutation($identifier: String!, $password: String!) {\n  loginWithPassword(identifier: $identifier, password: $password) {\n    user {\n      id\n      kaid\n      canAccessDistrictsHomepage\n      isTeacher\n      hasUnresolvedInvitations\n      transferAuthToken\n      preferredKaLocale {\n        id\n        kaLocale\n        status\n        __typename\n      }\n      __typename\n    }\n    isFirstLogin\n    error {\n      code\n      __typename\n    }\n    __typename\n  }\n}\n"
    }

    let url = `${BASE_URL}/api/internal/graphql/loginWithPasswordMutation`

    return this.post(url, payload, {
      headers: {
        Cookie: "fkey=fkey",
        "x-ka-fkey": "fkey",
        'Content-Type': 'application/json'
      },
    })
  }

  signupAdultWithPasswordMutation = async ({
    password,
    email,
    firstname,
    lastname,
    role = "TEACHER",
  }) => {
    const payload = {
      operationName: "signupAdultWithPasswordMutation",
      variables: {
        password,
        email,
        firstname,
        lastname,
        role,
      },
      query:
        'mutation signupAdultWithPasswordMutation($email: String!, $password: String!, $firstname: String!, $lastname: String!, $role: UserRole!) {\n  signupAdultWithPassword(email: $email, password: $password, firstname: $firstname, lastname: $lastname, role: $role) {\n    user {\n      id\n      kaid\n      canAccessDistrictsHomepage\n      isTeacher\n      hasUnresolvedInvitations\n      transferAuthUrl(pathname: "")\n      preferredKaLocale {\n        id\n        kaLocale\n        __typename\n      }\n      __typename\n    }\n    error {\n      code\n      __typename\n    }\n    __typename\n  }\n}\n',
    }

    let url = `${BASE_URL}/api/internal/graphql/signupAdultWithPasswordMutation`

    return this.post(url, payload, {
      headers: {
        Cookie: "fkey=fkey",
        "x-ka-fkey": "fkey",
      },
    })
  }

  logout() {
    let url = `${BASE_URL}/logout`
    return this.get(url)
  }

  getCoach = async () => {
    let payload = {
      operationName: "getCoach",
      query:
        "query getCoach {\n  coach {\n    id\n    nickname\n    __typename\n  }\n  countries {\n    id\n    code\n    translatedName\n    __typename\n  }\n  user {\n    id\n    tosForFormalTeacherStatus\n    schoolAffiliation {\n      id\n      name\n      postalCode\n      location\n      __typename\n    }\n    affiliationCountryCode\n    __typename\n  }\n}\n",
      variables: {},
    }
    return this.graphQL("/getCoach", payload)
  }

  ProgressByStudent = async (classId, pageSize = 1000, after = null) => {
    let payload = {
      operationName: "ProgressByStudent",
      variables: {
        classId,
        assignmentFilters: { dueAfter: null, dueBefore: null },
        after,
        pageSize,
      },
      query:
        "query ProgressByStudent($assignmentFilters: CoachAssignmentFilters, $classId: String!, $pageSize: Int, $after: ID) {\n  coach {\n    id\n    studentList(id: $classId) {\n      id\n      cacheId\n      studentKaidsAndNicknames {\n        id\n        coachNickname\n        __typename\n      }\n      assignmentsPage(filters: $assignmentFilters, after: $after, pageSize: $pageSize) {\n        assignments {\n          id\n          dueDate\n          contents {\n            id\n            translatedTitle\n            kind\n            defaultUrlPath\n            __typename\n          }\n          itemCompletionStates: itemCompletionStatesForAllStudents {\n            completedOn\n            studentKaid\n            bestScore {\n              numAttempted\n              numCorrect\n              __typename\n            }\n            __typename\n          }\n          __typename\n        }\n        pageInfo {\n          nextCursor\n          __typename\n        }\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}\n",
    }

    return this.graphQL("/ProgressByStudent", payload)
  }

  getStudentsList = async ({ classId = "", pageSize = 40 }) => {
    let payload = {
      operationName: "getStudentsList",
      variables: { hasClassId: !!classId, classId, after: 0, pageSize, teacherKaid: this.user.kaid },
      query:
        "query getStudentsList($hasClassId: Boolean!, $classId: String!, $teacherKaid: String!, $after: Int, $pageSize: Int) {\n  coach {\n    id\n    countStudents: coacheeCount @skip(if: $hasClassId)\n    studentsPage(after: $after, pageSize: $pageSize) @skip(if: $hasClassId) {\n      ...StudentField\n      __typename\n    }\n    invitations @skip(if: $hasClassId) {\n      ...InvitationsField\n      __typename\n    }\n    coachRequests @skip(if: $hasClassId) {\n      ...CoachRequestField\n      __typename\n    }\n    cleverCoachRequests @skip(if: $hasClassId) {\n      ...CleverCoachRequestField\n      __typename\n    }\n    studentLists: coachedStudentLists {\n      id\n      cacheId\n      name\n      topicTitle\n      key\n      studentKaids @skip(if: $hasClassId)\n      isDistrictSynced\n      __typename\n    }\n    studentList(id: $classId) @include(if: $hasClassId) {\n      id\n      cacheId\n      name\n      key\n      autoGenerated\n      signupCode\n      topics {\n        id\n        key\n        iconPath\n        __typename\n      }\n      countStudents\n      studentsPage(after: $after, pageSize: $pageSize) {\n        ...StudentField\n        __typename\n      }\n      invitations {\n        ...InvitationsField\n        __typename\n      }\n      coachRequests {\n        ...CoachRequestField\n        __typename\n      }\n      cleverCoachRequests {\n        ...CleverCoachRequestField\n        __typename\n      }\n      isDistrictSynced\n      __typename\n    }\n    schoolAffiliation {\n      id\n      __typename\n    }\n    affiliationCountryCode\n    __typename\n  }\n  user {\n    id\n    tosForFormalTeacherStatus\n    __typename\n  }\n}\n\nfragment CleverCoachRequestField on CleverCoachRequest {\n  id\n  email: studentIdentifier\n  __typename\n}\n\nfragment CoachRequestField on CoachRequest {\n  id\n  email: studentIdentifier\n  __typename\n}\n\nfragment InvitationsField on Invitation {\n  id\n  email\n  accepted\n  __typename\n}\n\nfragment StudentField on StudentsPage {\n  students {\n    kaid\n    id\n    email\n    coachNickname(teacherKaid: $teacherKaid)\n    profileRoot\n    username\n    __typename\n  }\n  nextCursor\n  __typename\n}\n",
    }
    return this.graphQL("/getStudentsList", payload)
  }

  ClassSubjectMasteryProgress = async ({ classId, topicId, teacherKaid }) => {
    let payload = {
      operationName: "ClassSubjectMasteryProgress",
      variables: {
        classId,
        topicId,
        teacherKaid,
      },
      query:
        "query ClassSubjectMasteryProgress($classId: String!, $topicId: String!, $teacherKaid: String!) {\n  topicById(id: $topicId) {\n    id\n    childTopics {\n      id\n      translatedTitle\n      __typename\n    }\n    __typename\n  }\n  coach {\n    id\n    studentList(id: $classId) {\n      id\n      cacheId\n      students {\n        id\n        coachNickname(teacherKaid: $teacherKaid)\n        subjectProgress(topicId: $topicId) {\n          currentMastery {\n            percentage\n            pointsEarned\n            pointsAvailable\n            __typename\n          }\n          unitProgresses {\n            topic {\n              id\n              __typename\n            }\n            currentMastery {\n              percentage\n              pointsEarned\n              pointsAvailable\n              __typename\n            }\n            __typename\n          }\n          __typename\n        }\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}\n",
    }

    return this.graphQL("/ClassSubjectMasteryProgress", payload)
  }

  getFullUserProfile = async () => {
    let payload = {
      operationName: "getFullUserProfile",
      variables: {},
      query:
        'query getFullUserProfile($kaid: String, $username: String) {\n  user(kaid: $kaid, username: $username) {\n    id\n    kaid\n    key\n    userId\n    email\n    username\n    profileRoot\n    gaUserId\n    qualarooId\n    isPhantom\n    isDeveloper: hasPermission(name: "can_do_what_only_admins_can_do")\n    isCurator: hasPermission(name: "can_curate_tags", scope: ANY_ON_CURRENT_LOCALE)\n    isCreator: hasPermission(name: "has_creator_role", scope: ANY_ON_CURRENT_LOCALE)\n    isPublisher: hasPermission(name: "can_publish", scope: ANY_ON_CURRENT_LOCALE)\n    isModerator: hasPermission(name: "can_moderate_users", scope: GLOBAL)\n    isParent\n    isSatStudent\n    isTeacher\n    isDataCollectible\n    isChild\n    isOrphan\n    isCoachingLoggedInUser\n    canModifyCoaches\n    nickname\n    hideVisual\n    joined\n    points\n    countVideosCompleted\n    publicBadges {\n      badgeCategory\n      description\n      isOwned\n      isRetired\n      name\n      points\n      absoluteUrl\n      hideContext\n      icons {\n        smallUrl\n        compactUrl\n        emailUrl\n        largeUrl\n        __typename\n      }\n      relativeUrl\n      safeExtendedDescription\n      slug\n      translatedDescription\n      translatedSafeExtendedDescription\n      __typename\n    }\n    bio\n    background {\n      name\n      imageSrc\n      __typename\n    }\n    soundOn\n    muteVideos\n    prefersReducedMotion\n    noColorInVideos\n    autocontinueOn\n    avatar {\n      name\n      imageSrc\n      __typename\n    }\n    hasChangedAvatar\n    newNotificationCount\n    canHellban: hasPermission(name: "can_ban_users", scope: GLOBAL)\n    canMessageUsers: hasPermission(name: "can_send_moderator_messages", scope: GLOBAL)\n    discussionBanned\n    isSelf: isActor\n    hasStudents: hasCoachees\n    hasClasses\n    hasChildren\n    hasCoach\n    badgeCounts\n    homepageUrl\n    isMidsignupPhantom\n    includesDistrictOwnedData\n    preferredKaLocale {\n      id\n      kaLocale\n      status\n      __typename\n    }\n    underAgeGate {\n      parentEmail\n      daysUntilCutoff\n      approvalGivenAt\n      __typename\n    }\n    authEmails\n    signupDataIfUnverified {\n      email\n      emailBounced\n      __typename\n    }\n    pendingEmailVerifications {\n      email\n      unverifiedAuthEmailToken\n      __typename\n    }\n    tosAccepted\n    shouldShowAgeCheck\n    __typename\n  }\n  actorIsImpersonatingUser\n}\n',
    }

    return this.graphQL("/getFullUserProfile", payload)
  }

  UserAssignments = async ({
    after = null,
    pageSize = 10,
    orderBy = "DUE_DATE_ASC",
    needAssignmentCount = false,
    studentListId,
    coachKaid,
    dueAfter,
    dueBefore,
  }) => {
    let payload = {
      operationName: "UserAssignments",
      variables: {
        after,
        pageSize,
        orderBy,
        needAssignmentCount,
        studentListId,
        coachKaid,
        dueAfter,
        dueBefore,
      },
      query:
        "query UserAssignments($after: ID, $dueAfter: DateTime, $dueBefore: DateTime, $pageSize: Int, $orderBy: AssignmentOrder!, $needAssignmentCount: Boolean!, $studentListId: String, $coachKaid: String) {\n  user {\n    id\n    kaid\n    assignmentCount(dueAfter: $dueAfter) @include(if: $needAssignmentCount)\n    assignmentsPage(after: $after, dueAfter: $dueAfter, dueBefore: $dueBefore, pageSize: $pageSize, orderBy: $orderBy, studentListId: $studentListId, coachKaid: $coachKaid) {\n      assignments {\n        id\n        key\n        subjectSlug\n        contents {\n          ...ContentFields\n          __typename\n        }\n        assignedDate\n        dueDate\n        studentList {\n          id\n          cacheId\n          name\n          __typename\n        }\n        totalCompletionStates: itemCompletionStates {\n          student {\n            id\n            kaid\n            __typename\n          }\n          state\n          completedOn\n          bestScore {\n            numCorrect\n            numAttempted\n            __typename\n          }\n          __typename\n        }\n        exerciseConfig {\n          itemPickerStrategy\n          __typename\n        }\n        __typename\n      }\n      pageInfo {\n        nextCursor\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}\n\nfragment ContentFields on LearnableContent {\n  contentId: id\n  id\n  kind\n  title: translatedTitle\n  defaultUrlPath\n  topicPaths {\n    path {\n      id\n      kind\n      slug\n      __typename\n    }\n    __typename\n  }\n  description: translatedDescription\n  thumbnailUrl\n  slug\n  ... on Exercise {\n    expectedDoNCount: exerciseLength\n    timeEstimate {\n      lowerBound\n      upperBound\n      __typename\n    }\n    __typename\n  }\n  ... on Video {\n    imageUrl: thumbnailUrl\n    youtubeId\n    translatedYoutubeId\n    duration\n    __typename\n  }\n  __typename\n}\n",
    }
    return this.graphQL("/UserAssignments", payload)
  }

  getLearnMenuProgress = async (slugs = []) => {
    /* possible options for slugs: [
      "kids",
      "cc-2nd-grade-math",
      "cc-third-grade-math",
      "cc-fourth-grade-math",
      "cc-fifth-grade-math",
      "cc-sixth-grade-math",
      "cc-seventh-grade-math",
      "cc-eighth-grade-math",
      "k-8-grades",
      "get-ready-for-3rd-grade",
      "get-ready-for-4th-grade",
      "get-ready-for-5th-grade",
      "get-ready-for-6th-grade",
      "get-ready-for-7th-grade",
      "get-ready-for-8th-grade",
      "get-ready-for-algebra-i",
      "get-ready-for-geometry",
      "get-ready-for-algebra-ii",
      "get-ready-for-precalculus",
      "algebra",
      "geometry",
      "algebra2",
      "trigonometry",
      "precalculus",
      "statistics-probability",
      "ap-calculus-ab",
      "ap-calculus-bc",
      "ap-statistics",
      "multivariable-calculus",
      "differential-equations",
      "linear-algebra",
      "math",
      "sat",
      "lsat",
      "praxis",
      "high-school-biology",
      "ap-biology",
      "ap-chemistry-beta",
      "ap-chemistry",
      "high-school-physics",
      "ap-physics-1",
      "science",
      "computer-programming",
      "ap-computer-science-principles",
      "computing",
      "us-history",
      "ap-us-history",
      "us-government-and-civics",
      "ap-us-government-and-politics",
      "high-school-civics",
      "whp-origins",
      "whp-1750",
      "art-history",
      "ap-art-history",
      "humanities",
      "macroeconomics",
      "ap-macroeconomics",
      "microeconomics",
      "ap-microeconomics",
      "economics-finance-domain",
      "kids",
      "cc-2nd-reading-vocab",
      "cc-3rd-reading-vocab",
      "cc-4th-reading-vocab",
      "cc-5th-reading-vocab",
      "cc-6th-reading-vocab",
      "cc-7th-reading-vocab",
      "cc-8th-reading-vocab",
      "cc-9th-reading-vocab",
      "ela",
      "kids",
      "career-content",
      "personal-finance",
      "learnstorm-growth-mindset-activities-us",
      "college-careers-more",
    ]
    */
    let payload = {
      operationName: "getLearnMenuProgress",
      variables: { slugs },
      query:
        "query getLearnMenuProgress($slugs: [String!]) {\n  user {\n    id\n    subjectProgressesBySlug(slugs: $slugs) {\n      topic {\n        id\n        slug\n        __typename\n      }\n      currentMastery {\n        percentage\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}\n",
    }
    return this.graphQL("/getLearnMenuProgress", payload)
  }

  createClassroomMutation = async ({ classroomName }) => {
    const payload = {
      operationName: "createClassroomMutation",
      variables: { classroomName },
      query:
        "mutation createClassroomMutation($classroomName: String!, $subscribeToUpdates: Boolean) {\n  createClassroom(classroomName: $classroomName, subscribeToUpdates: $subscribeToUpdates) {\n    classroom {\n      id\n      cacheId\n      key\n      name\n      signupCode\n      __typename\n    }\n    error {\n      code\n      __typename\n    }\n    __typename\n  }\n}\n",
    }
    const url = `${BASE_URL}/api/internal/graphql/createClassroomMutation`
    return this.post(url, payload, {
      headers: {
        Cookie: "fkey=fkey",
        "x-ka-fkey": "fkey",
      },
    })
  }
}
