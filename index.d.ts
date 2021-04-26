import { AxiosRequestConfig, AxiosResponse, AxiosPromise } from "axios"
export declare class KhanApi {
  authenticated: boolean
  user: unknown
  constructor()
  authenticate: (identifier: string, password: string) => Promise<any>
  axios(config: AxiosRequestConfig): AxiosPromise<any>
  get(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<any>>
  post(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<any>>
  graphQL: (
    endpoint: string,
    payload: any,
    method?: string
  ) => Promise<AxiosResponse<any>>
  /*************** ADD AND MAINTAIN METHODS BELOW *****************************/
  loginWithPasswordMutation: ({
    identifier,
    password,
  }: {
    identifier: string
    password: string
  }) => Promise<AxiosResponse<any>>
  signupAdultWithPasswordMutation: ({
    password,
    email,
    firstname,
    lastname,
    role,
  }: {
    password: string
    email: string
    firstname: string
    lastname: string
    role: string
  }) => Promise<AxiosResponse<any>>
  logout(): Promise<AxiosResponse<any>>
  getCoach: () => Promise<AxiosResponse<any>>
  ProgressByStudent: (
    classId: string,
    pageSize?: number,
    after?: null
  ) => Promise<AxiosResponse<any>>
  getStudentsList: ({
    classId,
    pageSize,
  }: {
    classId?: string | undefined
    pageSize?: number | undefined
  }) => Promise<AxiosResponse<any>>
  ClassSubjectMasteryProgress: ({
    classId,
    topicId,
  }: {
    classId: string
    topicId: string
  }) => Promise<AxiosResponse<any>>
  getFullUserProfile: () => Promise<AxiosResponse<any>>
  UserAssignments: ({
    after,
    pageSize,
    orderBy,
    needAssignmentCount,
    studentListId,
    coachKaid,
    dueAfter,
    dueBefore,
  }: {
    after: null | string
    pageSize: number
    orderBy: string
    needAssignmentCount: boolean
    studentListId: string
    coachKaid: string
    dueAfter: string
    dueBefore: string
  }) => Promise<AxiosResponse<any>>
  getLearnMenuProgress: (slugs?: never[]) => Promise<AxiosResponse<any>>
}
