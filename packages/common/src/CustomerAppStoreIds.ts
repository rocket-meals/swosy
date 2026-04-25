export type CustomerAppStoreIds = {
  appleAppId?: string;
  googlePlayPackageName?: string;
};

export const SWOSY_APP_STORE_IDS: CustomerAppStoreIds = {
  appleAppId: '6667117575',
  googlePlayPackageName: 'de.baumgartnersoftware.swosy',
};

export const STUDI_FUTTER_APP_STORE_IDS: CustomerAppStoreIds = {
  appleAppId: '1548108390',
  googlePlayPackageName: 'de.baumgartnersoftware.studifutter',
};

export const ALL_CUSTOMER_APP_STORE_IDS: CustomerAppStoreIds[] = [
  SWOSY_APP_STORE_IDS,
  STUDI_FUTTER_APP_STORE_IDS,
];
