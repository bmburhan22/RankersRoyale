import {
    ApiResponse,
    CustomResponse,
    GenericObjectInterface,
    routes,
    showWarningMessage,
  } from "@utilities/index";
  import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
  import { apiStatusCodes } from "./apiStatusCode";
  
  import { resetState, store } from "@/store/combinedStore/combinedStore";
  const environment = import.meta.env.MODE;
  
  // export const stagingURL = http://10.44.22.88:8080/;
  // export const productionURL = ``;
  
  export let BASE_URL = ""; //Local
  console.log(environment);
  // change to 13
  if (environment === "development") {
    // Live api
    BASE_URL = ""
    // local
    // BASE_URL = "http://10.44.1.87:8000/";
  } else {
    BASE_URL = "";
  }
  
  export const endPoints = {
    LOGIN: "api/login/",
    OTP_VERIFY: "api/verifyotp/",
    CSF_LIST: "csf/list/",
    USER_DETAILS: "api/details/",
    TRENDS_DROPDOWN_DATA: "trends/uniquevalues/",
    TRENDS_BRAND_DETAILS_1: "trends/horizontalbar",
    TRENDS_GROUPED_BARS: "trends/verticalbar",
    TRENDS_BVP_GROUPED_BARS: "trends/bvpver",
    TRENDS_LINED_BARS: "trends/line",
    TRENDS_PIE_CHART: "trends/piechart",
    TRENDS_PPG_PIE_CHART: "trends/l3pie",
    TRENDS_CORRELATION_CHART: "trends/corrtrends",
    CLIENT_ONBOARD: "csf/client/",
    PRE_TRENDS: "csf/pre-trends/",
    VALIDATED0: "csf/validated0/",
    GET_POST_PRETRENDS_DATA: "csf/trendsvalues/",
    L0KEYS_MODIFIED: "csf/mapl0/",
    L1L2L3Keys_MODIFIED: "csf/maptrends/",
    CSFR_MSP_DATA: "csfr/msp",
    CSF_RESULTS_UNIQUE_VALS: "csfr/csfrunique/",
    CSFR_RPI: "csfr/rpi",
    CSFR_VOL_DEC: "csfr/voldecomp",
    CSFR_LINE: "csfr/csfrline",
    CSFR_PIE_CHART: "csfr/csfrpie",
    CSFR_GET_PRECONFIG: "csfr/precsfr", // get pre-trends config data for pre csf
    CSFR_SUBMIT_L0CONFIG: "csfr/csfrmapl0", // submit l0 config in pre csf
    CSFR_SUBMIT_L1L2L3CONFIG: "csfr/mapcsfr", // submit l1l2l3 config in pre csf
    CSF_DELETE: "csf/deletecsf",
    CSF_CLIENT_ONBOARD: "onboard/clients/",
    CFS_INDIVIDUAL_CLIENT_ONBOARD: "onboard/client",
    CFS_INDIVIDUAL_CSFUSER_ONBOARD: "onboard/csfuser",
    CSF_CLIENT_ONBOARD_STUDY: "onboard/studies/",
    CFS_INDIVIDUAL_STUDY_ONBOARD: "onboard/study",
    CSF_CLIENT_ONBOARD_USERS: "onboard/csfusers/",
    CSF_GETDJSON: "csf/getd0json",
    CSF_FILEUPLOAD: "csfr/csfrfiles",
  };
  
  export const headersList = {
    Accept: "/",
    "Content-Type": "application/json",
  };
  
  // Common function to make API calls using Axios
  const makeApiRequest = async <T>(
    method: AxiosRequestConfig["method"],
    url: string,
    data: any = null,
    customHeaders: GenericObjectInterface
  ): Promise<ApiResponse<T>> => {
    try {
      const response: AxiosResponse<T> = await axios({
        method,
        url,
        data,
        headers: customHeaders,
      });
  
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      throw error; // Rethrow the error to be handled where the function is called
    }
  };
  
  // Making a GET request
  export const fetchData = async <DataType>(
    endPoint: string,
    customHeaders: GenericObjectInterface = headersList,
    payload: GenericObjectInterface | null = null
  ): Promise<CustomResponse<DataType>> => {
    try {
      const response = await makeApiRequest(
        "get",
        BASE_URL + endPoint,
        payload,
        customHeaders
      );
      console.log(response, "lll1");
  
      return {
        data: response?.data as DataType,
        status: response?.status,
      };
    } catch (error: any) {
      if (
        error?.response?.status === apiStatusCodes.UNAUTHORIZED &&
        !window.location?.pathname?.match(routes.AUTH)
      ) {
        store.dispatch(resetState());
        // window.location.pathname = routes.AUTH;
        showWarningMessage(
          "Your session has expired. Please log in again to continue."
        );
      }
      throw error;
    }
  };
  
  // Making a POST request
  export const postData = async <DataType>(
    endPoint: string,
    postData: any,
    customHeaders: GenericObjectInterface = headersList
  ): Promise<CustomResponse<DataType>> => {
    try {
      const response = await makeApiRequest(
        "post",
        BASE_URL + endPoint,
        postData,
        customHeaders
      );
      return {
        data: response?.data as DataType,
        status: response?.status,
      };
    } catch (error) {
      throw error;
    }
  };
  
  // Making a PATCH request
  export const patchData = async <DataType>(
    endPoint: string,
    patchData: any,
    customHeaders: GenericObjectInterface = headersList
  ): Promise<CustomResponse<DataType>> => {
    try {
      const response = await makeApiRequest(
        "patch",
        BASE_URL + endPoint,
        patchData,
        customHeaders
      );
      return {
        data: response?.data as DataType,
        status: response?.status,
      };
    } catch (error) {
      throw error;
    }
  };
  
  // Making a DELETE request
  export const deleteData = async <DataType>(
    endPoint: string,
    customHeaders: GenericObjectInterface = headersList,
    deleteObject: any = null
  ): Promise<CustomResponse<DataType>> => {
    try {
      const response = await makeApiRequest(
        "delete",
        BASE_URL + endPoint,
        deleteObject,
        customHeaders
      );
      return {
        data: response?.data as DataType,
        status: response?.status,
      };
    } catch (error) {
      throw error;
    }
  };
  
  export const putData = async <DataType>(
    endPoint: string,
    putData: any,
    customHeaders: GenericObjectInterface = headersList
  ): Promise<CustomResponse<DataType>> => {
    try {
      const response = await makeApiRequest(
        "put",
        BASE_URL + endPoint,
        putData,
        customHeaders
      );
      console.log("PUT Response:", customHeaders);
      return {
        data: response?.data as DataType,
        status: response?.status,
      };
    } catch (error) {
      console.log("PUT Error:", error);
      throw error;
    }
  };