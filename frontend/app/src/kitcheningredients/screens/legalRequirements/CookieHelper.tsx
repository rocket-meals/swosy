import React from "react";
import {ConfigHolder} from "../../ConfigHolder";

export enum CookieGroupEnum {
  Necessary = "Necessary",
}

export enum CookieStorageTypeEnum {
  LocalStorage = "LocalStorage",
  HTTP = "HTTP"
}

export class CookieHelper {
  static CookieDictNameToDetails: { [key: string]: any } = {}
}

export type Cookie = {
  name: string;
  value: string;
  date_created: Date;
}

export type CookieDetails = {
  name: string;
  provider: string;
  provider_url: string;
  purpose: string;
  expiry: string;
  type: CookieGroupEnum | string;
  storageType: CookieStorageTypeEnum;
}

export type CookieConfigType = {
  date_consent: string,
  // consent: {[key: string]: boolean}
  consent: { [key: string]: boolean }
}

export function getDefaultCookieConfig(): CookieConfigType {
  let empty: any = {
    date_consent: null,
    consent: {
      [CookieGroupEnum.Necessary]: true
    }
  }
  let cookieAdditionGroups = ConfigHolder.plugin.getCookieAdditionalGroups();
  let cookieConsentGroups = [];
  if (cookieAdditionGroups) {
    cookieConsentGroups = cookieAdditionGroups;
  }
  for (let cookieConsentGroup of cookieConsentGroups) {
    empty.consent[cookieConsentGroup] = false;
  }
  return empty;
}

export function getAcceptAllCookieConfig(): CookieConfigType {
  let empty: any = getDefaultCookieConfig();
  let cookieAdditionGroups = ConfigHolder.plugin.getCookieAdditionalGroups();
  let cookieConsentGroups = [];
  if (cookieAdditionGroups) {
    cookieConsentGroups = cookieAdditionGroups;
  }
  for (let cookieConsentGroup of cookieConsentGroups) {
    empty.consent[cookieConsentGroup] = true;
  }
  return empty;
}
