import {EnvVariableHelper} from "../../../helpers/EnvVariableHelper";
import {FormImportSyncWorkflow} from "../../FormImportSyncWorkflow";
import {
    HANNOVER_TL1_EXTERNAL_HOUSING_CONTRACT_FIELDS,
    HannoverTL1HousingFileReader,
    ImportHousingContract,
    Tl1ImportHousingContracts
} from "./HannoverTL1HousingFileReader";
import {
    FormAnswersValueFieldKeys,
    FormImportSyncFormAnswer,
    FormImportSyncFormAnswers,
    FormImportSyncFormSubmissions
} from "../../FormImportTypes";
import {DateHelper} from "../../../helpers/DateHelper";


export class FormHousingContractsWorkflowHannover extends FormImportSyncWorkflow {

    static FORM_INTERNAL_ID = "housing-contract-sync-hannover";

    private reader: HannoverTL1HousingFileReader;
    private contracts: Tl1ImportHousingContracts = [];

    constructor() {
        super();
        this.reader = new HannoverTL1HousingFileReader(EnvVariableHelper.getHousingContractCsvFilePath());
    }

    getWorkflowId(): string {
        return "housing-contract-sync-hannover";
    }

    async createNeededData(): Promise<void> {
        let data = await this.reader.readData()
        this.contracts = data;
    }

    async getCurrentResultHash(): Promise<string> {
        return await this.reader.getResultHash(this.contracts);
    }

    public static getFormImportSyncFormAnswer(contract: ImportHousingContract, key: keyof ImportHousingContract): FormImportSyncFormAnswer {
        let value_raw = contract[key];

        let result: FormImportSyncFormAnswer = {
            external_import_id: key
        };

        switch (key) {
            case HANNOVER_TL1_EXTERNAL_HOUSING_CONTRACT_FIELDS.MIETER_MIETBEGINN:
            case HANNOVER_TL1_EXTERNAL_HOUSING_CONTRACT_FIELDS.MIETER_MIETENDE:
            case HANNOVER_TL1_EXTERNAL_HOUSING_CONTRACT_FIELDS.MIETER_AUSZUGSDATUM:
                // date is stored as string in format "DD.MM.YYYY"
                //console.log("Parsing date: " + value_raw);
                let date = DateHelper.parseDD_MM_YYYY(value_raw);
                //console.log("Parsed date: ", date);
                let date_as_string_without_timezone = DateHelper.formateDateToDatabaseDateOnlyString(date);
                if(date_as_string_without_timezone.includes("NaN")){
                    throw new Error(`Invalid date string: ${value_raw}`);
                }

                result.value_date = date_as_string_without_timezone;
                break;
            case HANNOVER_TL1_EXTERNAL_HOUSING_CONTRACT_FIELDS.WOHNUNGSNUMMER:
            case HANNOVER_TL1_EXTERNAL_HOUSING_CONTRACT_FIELDS.MIETER_EMAIL:
            case HANNOVER_TL1_EXTERNAL_HOUSING_CONTRACT_FIELDS.MIETER_PERSONENNUMMER:
            case HANNOVER_TL1_EXTERNAL_HOUSING_CONTRACT_FIELDS.MIETER_PERSON_VORNAME:
            case HANNOVER_TL1_EXTERNAL_HOUSING_CONTRACT_FIELDS.MIETER_PERSON_NACHNAME:
            case HANNOVER_TL1_EXTERNAL_HOUSING_CONTRACT_FIELDS.MIETER_TELEFON_MOBILE:
            case HANNOVER_TL1_EXTERNAL_HOUSING_CONTRACT_FIELDS.WOHNUNGSNAME:
                result.value_string = value_raw;
                break;
        }

        return result;
    }

    private getFormImportSyncFormAnswers(contract: ImportHousingContract): FormImportSyncFormAnswers {
        let formAnswers: FormImportSyncFormAnswers = [];
        for (let key in contract) {
            if (Object.prototype.hasOwnProperty.call(contract, key)) { // Ensure the key belongs to the object itself
                let formAnswer = FormHousingContractsWorkflowHannover.getFormImportSyncFormAnswer(contract, key as keyof ImportHousingContract);
                formAnswers.push(formAnswer);
            }
        }

        return formAnswers;
    }


    async getData(): Promise<FormImportSyncFormSubmissions[]> {
        let result: FormImportSyncFormSubmissions[] = [];
        for (let contract of this.contracts) {
            let internal_custom_id = this.reader.getHousingContractInternalCustomId(contract);
            // add form interal custom id as prefix
            internal_custom_id = `${this.getFormInternalCustomId()}-${internal_custom_id}`;

            let formSubmission: FormImportSyncFormSubmissions = {
                alias: this.reader.getAlias(contract),
                internal_custom_id: internal_custom_id,
                form_answers: this.getFormImportSyncFormAnswers(contract)
            };
            result.push(formSubmission);
        }
        return result;
    }

    getFormAlias(): string {
        return "Hannover Housing Contract";
    }

    getFormInternalCustomId(): string {
        return FormHousingContractsWorkflowHannover.FORM_INTERNAL_ID;
    }



}