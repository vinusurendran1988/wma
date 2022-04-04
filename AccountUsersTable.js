import parse from 'html-react-parser';
import { Dialog } from 'primereact/dialog';
import React, { Component } from 'react';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import FieldBank from '../../common/components/fieldbank';
import Button from '../../common/components/fieldbank/Button';
import { FIELDTYPE_TABLE } from '../../common/components/fieldbank/Constants';
import { fetchMasterData } from '../../common/middleware/redux/commonAction';
import {
    getFormattedDate,
    withSuspense,
    getAdditionalTableClassNames,
    getRelativeDate,
    getCurrentDate
} from '../../common/utils';
import { ACCOUNT_USER_PRIVILEGE, BLANK, CONFIG_SECTION_DEFAULT, CONFIG_SECTION_MANAGE_ACCOUNT_USERS } from '../../common/utils/Constants';
import { doAdditionalMapping } from '../../common/utils/object.utils';
import { getItemFromBrowserStorage, setItemToBrowserStorage, BROWSER_STORAGE_KEY_MEMBERSHIP_NO } from '../../common/utils/storage.utils';
import { NAVIGATE_CLUB } from '../../common/utils/urlConstants';
import { DATE_FORMAT_DDMMYYYY_WITH_SPACE, JOIN_ENDPOINT, RENEW_ENDPOINT } from '../../ui/subscription/Constants';
import { deleteAccountUser, updateAccountUserPrivilege } from './actions';
import { ACCOUNT_HOLDER, ACCOUNT_STATUS, DELETED } from './Constants';
import { doPost } from "../../common/utils/api"
import { _URL_TRANSACTION_SUMMARY } from "../../common/config/config"


/**
 * Table to display nominees
 * @author Amrutha
 */
class AccountUsersTable extends Component {
    constructor(props) {
        super(props);
        this.state = {
            pointBlockObject: null,
            showModal: false,
            nomineeData: {},
            enabled: false,
            accountUserInfo: {},
            deleteAccountUserRequest: {},
            updateAccountUserRequest: {},
            nomineeAccountGroupType: "",
            openDeleteConfirmModal: false,
            accountUserToDelete: {}
        }
    }

    /**
     * Column template for update/delete action
     * @param {rowData} Nominee details
     * 
     * @author Amrutha J Raj
     */
    actionBodyTemplate = (rowData, props) => {
        const memNo = getItemFromBrowserStorage("membershipNumber")
        const { t, config } = this.props
        return <React.Fragment>
            <a href="javascript:void(0)" onClick={() => this.props.editUser(rowData)} role="button" >{t('corpReg.addMember.edit')}</a>
            &nbsp;   &nbsp;
            {rowData && rowData.accountGroupType !== ACCOUNT_HOLDER &&
                rowData.membershipNumber != memNo &&
                    <i class="fa fa-trash" type="button" title="Remove" aria-hidden="true"
                        onClick={() => this.setState( { openDeleteConfirmModal: true, accountUserToDelete: rowData },
                            () => {
                                if (config) {
                                    if (config.ui && config.ui.layout &&
                                        config.ui.layout.elements &&
                                        config.ui.layout.elements.delete_account_user &&
                                        config.ui.layout.elements.delete_account_user.request &&
                                        config.ui.layout.elements.delete_account_user.request.additionalMapping ) {
                                        doAdditionalMapping(this, "deleteAccountUserRequest", config.ui.layout.elements.delete_account_user.request.additionalMapping)
                                    }
                                }
                            }
                        )}>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M6 3C6 1.34315 7.34315 0 9 0H11C12.6569 0 14 1.34315 14 3H18V5H17V18C17 19.1046 16.1046 20 15 20H5C3.89543 20 3 19.1046 3 18V5H2V3H6ZM8 3H12C12 2.44772 11.5523 2 11 2H9C8.44772 2 8 2.44772 8 3ZM5 5H15V17C15 17.5523 14.5523 18 14 18H6C5.44772 18 5 17.5523 5 17V5ZM11.7929 8.29289C12.1834 7.90237 12.8166 7.90237 13.2071 8.29289C13.5976 8.68342 13.5976 9.31658 13.2071 9.70711L11.4142 11.5L13.2071 13.2929C13.5976 13.6834 13.5976 14.3166 13.2071 14.7071C12.8166 15.0976 12.1834 15.0976 11.7929 14.7071L10 12.9142L8.20711 14.7071C7.81658 15.0976 7.18342 15.0976 6.79289 14.7071C6.40237 14.3166 6.40237 13.6834 6.79289 13.2929L8.58579 11.5L6.79289 9.70711C6.40237 9.31658 6.40237 8.68342 6.79289 8.29289C7.18342 7.90237 7.81658 7.90237 8.20711 8.29289L10 10.0858L11.7929 8.29289Z" fill="#008392"></path>
                            <mask id="mask0_7462_18197" style={{"mask-type":"alpha"}} maskUnits="userSpaceOnUse" x="2" y="0" width="16" height="20">
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M6 3C6 1.34315 7.34315 0 9 0H11C12.6569 0 14 1.34315 14 3H18V5H17V18C17 19.1046 16.1046 20 15 20H5C3.89543 20 3 19.1046 3 18V5H2V3H6ZM8 3H12C12 2.44772 11.5523 2 11 2H9C8.44772 2 8 2.44772 8 3ZM5 5H15V17C15 17.5523 14.5523 18 14 18H6C5.44772 18 5 17.5523 5 17V5ZM11.7929 8.29289C12.1834 7.90237 12.8166 7.90237 13.2071 8.29289C13.5976 8.68342 13.5976 9.31658 13.2071 9.70711L11.4142 11.5L13.2071 13.2929C13.5976 13.6834 13.5976 14.3166 13.2071 14.7071C12.8166 15.0976 12.1834 15.0976 11.7929 14.7071L10 12.9142L8.20711 14.7071C7.81658 15.0976 7.18342 15.0976 6.79289 14.7071C6.40237 14.3166 6.40237 13.6834 6.79289 13.2929L8.58579 11.5L6.79289 9.70711C6.40237 9.31658 6.40237 8.68342 6.79289 8.29289C7.18342 7.90237 7.81658 7.90237 8.20711 8.29289L10 10.0858L11.7929 8.29289Z" fill="white"></path>
                            </mask>
                            <g mask="url(#mask0_7462_18197)">
                            </g>
                        </svg>
                    </i>
            }
        </React.Fragment>
    }
    
    groupTemplate = (rowData, props) => {
        let className
        const { column } = props
        if(column && column.props && column.props.config && column.props.config.additionalClassNames && column.props.config.additionalClassNames.length) {
            className = getAdditionalTableClassNames(column.props.config.additionalClassNames, rowData)
        }
        return (
            <React.Fragment>
               <span className={className}>{rowData.groupName && rowData.groupName != BLANK ? rowData.groupName : ""}</span>
            </React.Fragment>
        );
    }

    /**
    * Method to delete account user 
    * @param {accountUser}  Accountuser to be deleted 
    * 
    * @author Amrutha J Raj
    * 
    */
    deleteConfirmModal = () => {
        return (<Dialog
            aria-labelledby={`Label`}
            aria-modal="true"
            id={"delete"}
            dismissableMask={true}
            closable={true}
            visible={this.state.openDeleteConfirmModal}
            header={<h4 style={{ "padding-left": "1rem" }}> Are you sure? </h4>}
            header={<h4 style={{ "padding-left": "1rem" }}> {this.props.t('manage_account_users.delete_prompt.title')} </h4>}
            className="confirm-modal"
            style={{ width: '896px' }}
            onHide={() => this.setState({ openDeleteConfirmModal: false })}
            footer={
                <div className="btn-wrap btn-wrap--grp" style={{ "text-align": "left", "padding-left": "1rem" }}>
                    <Button
                        className="btn btn-primary"
                        handleOnClick={() => this.deleteAccountUserClick(this.state.accountUserToDelete)}
                        id="delete-button"
                        label={this.props.t("manage_account_users.delete_prompt.submit")} />
                    <Button
                        className="btn btn-secondary"
                        handleOnClick={() => this.setState({ openDeleteConfirmModal: false })}
                        id="delete-cancel"
                        label={this.props.t("manage_account_users.delete_prompt.cancel")} />
                </div>
            }
        >
            <div className="modal-body">
                <p>{parse(this.props.t("manage_account_users.delete_prompt.message").replace("{NAME}",
                    this.state.accountUserToDelete.givenName + " " + this.state.accountUserToDelete.familyName))}</p>
            </div>
        </Dialog>
        )
    }

    getDeleteRequestBody = () => {
        const { defaultConfig } = this.props
        let accGroupTypeKey
        let requestBody = JSON.parse(JSON.stringify(this.state.deleteAccountUserRequest))
        if (requestBody && requestBody.object && requestBody.object.nomineeDetails &&
            Object.keys(requestBody.object.nomineeDetails).length > 0) {
            const accountGroupType = requestBody.object.nomineeDetails[0].accountGroupType
            if (defaultConfig && defaultConfig.programs) {
                const prog = defaultConfig.programs.find(prog => prog.id == "defa_prg")
                if (prog && prog.data && prog.data.nomineeAccountGroupTypes) {
                    accGroupTypeKey = prog.data.nomineeAccountGroupTypes.find(item => item.value == accountGroupType)
                }
            }
            if (accGroupTypeKey) {
                requestBody.object.nomineeDetails[0].accountGroupType = accGroupTypeKey.key
            }

            if (requestBody.object.nomineeDetails[0].customerDynamicAttribute) {
                delete requestBody.object.nomineeDetails[0]["customerDynamicAttribute"]
            }
            if (requestBody.object.nomineeDetails[0] && requestBody.object.nomineeDetails[0].memberType == "D") {
                requestBody.object.nomineeDetails[0].membershipNumber = ""
            }
            if (requestBody.object.nomineeDetails[0] && requestBody.object.nomineeDetails[0].groupName == BLANK) {
                requestBody.object.nomineeDetails[0].groupName = ""
            }
            if(requestBody.object.nomineeDetails[0].tierStatus==BLANK){
                requestBody.object.nomineeDetails[0].tierStatus = ""
            }
            requestBody.object.nomineeDetails[0].nomineeStatus = "D"
        }

        return requestBody
    }
    /**
      * Method to delete account user 
      * @param {accountUser}  Accountuser to be deleted 
      * 
      * @author Amrutha J Raj
      * 
      */
    deleteAccountUserClick = (accountUser) => {
        const { config, defaultConfig, companyData } = this.props
        let request
        this.setState({
            accountUserInfo: accountUser,
            openDeleteConfirmModal: false,
        })
        this.props.clearResponse()
        if (this.state.deleteAccountUserRequest && Object.keys(this.state.deleteAccountUserRequest).length > 0) {
            request = this.getDeleteRequestBody()
            console.log("Delete Req Body = ", request);
        }

        this.props.deleteAccountUser(request, companyData)
    }


    accountGroupTypeTemplate = (rowData, props) => {
        let className
        const { column } = props
        if(column && column.props && column.props.config && column.props.config.additionalClassNames && column.props.config.additionalClassNames.length) {
            className = getAdditionalTableClassNames(column.props.config.additionalClassNames, rowData)
        }
        return (
            <React.Fragment>
                <span className={className}>{rowData && rowData.accountGroupType}</span>
            </React.Fragment>
        );
    }

    getTierStatus = (rowData, props) => {
        if (rowData && rowData[props.field]) {
            if (rowData[props.field] == "Yes") {
                return <i className="fa fa-check" style={{ color: "black" }}></i>
            }
            else if (rowData[props.field] == BLANK) {
                return ""
            }
            else {
                return rowData[props.field]
            }

        }

    }
    tierBenefitsTemplate = (rowData, props) => {
        let className
        const { column } = props
        if(column && column.props && column.props.config && column.props.config.additionalClassNames && column.props.config.additionalClassNames.length) {
            className = getAdditionalTableClassNames(column.props.config.additionalClassNames, rowData)
        }
        return (
            <React.Fragment>
                <span className={className}>
                {this.getTierStatus(rowData,props)}
                </span>
            </React.Fragment>
        );
    }

    adminOnBehalf = (type, data) => {
        let nomineeObject = {
            "membershipNumber": data.membershipNumber,
            "fname": data.givenName,
            "lname": data.familyName,
            "email": data.emailAddress,
            "address": {
                "addressLine1": "",
                "addressLine2": "",
                "streetNumber": "",
                "district": "",
                "city": "",
                "zip": "",
                "state": "",
                "country": ""
            }
        };
        let payload = {
            "object": {
                "companyCode": "NZ",
                "programCode": "KORU",
                "membershipNumber": data.membershipNumber,
                "pageNumber": "1",
                "absoluteIndex": "1",
                "pageSize": "1",
                "queryFilter": [
                    {
                        "queryCode": "MPQRY3",
                        "queryFilterAttributes": [
                            {
                                "attributeCode": "MEMSHPNUM",
                                "attributeValue": data.membershipNumber
                            }
                        ]
                    }
                ]
            }
        };
        doPost(_URL_TRANSACTION_SUMMARY, payload)
            .then(function (response) {
                debugger;
                console.log(JSON.stringify(response.data));
                let address = response.data.object.queryResults[0].queryResultList[0];
                nomineeObject.address.addressLine1 = address.addressLine1;
                nomineeObject.address.addressLine2 = address.addressLine2;
                nomineeObject.address.district = address.district;
                nomineeObject.address.city = address.city;
                nomineeObject.address.zip = address.zipCode;
                nomineeObject.address.state = address.state;
                nomineeObject.address.country = address.country;
                setItemToBrowserStorage("corpEmployeeDetails", JSON.stringify(nomineeObject));
                if (type == "join") {
                    setItemToBrowserStorage("overView", "");
                    window.location.href = `#${NAVIGATE_CLUB}${JOIN_ENDPOINT}`;
                } else if (type == "renew") {
                    let overviewObject = {
                        "status": "success",
                        "response": {
                            "membershipDetails": {
                            "expiryDate": data.accountExipryDate
                            }
                        }
                    };
                    setItemToBrowserStorage("overView", JSON.stringify(overviewObject));
                    window.location.href = `#${NAVIGATE_CLUB}${RENEW_ENDPOINT}`;
                }
            })
            .catch(function (error) {
                setItemToBrowserStorage("corpEmployeeDetails", JSON.stringify(nomineeObject));
                if (type == "join") {
                    setItemToBrowserStorage("overView", "");
                    window.location.href = `#${NAVIGATE_CLUB}${JOIN_ENDPOINT}`;
                } else if (type == "renew") {
                    let overviewObject = {
                        "status": "success",
                        "response": {
                            "membershipDetails": {
                            "expiryDate": data.accountExipryDate
                            }
                        }
                    };
                    setItemToBrowserStorage("overView", JSON.stringify(overviewObject));
                    window.location.href = `#${NAVIGATE_CLUB}${RENEW_ENDPOINT}`;
                }
            });
    }

    koruStatusTemplate = (rowData, props) => {
        let className
        const { column } = props
        if(column && column.props && column.props.config && column.props.config.additionalClassNames && column.props.config.additionalClassNames.length) {
            className = getAdditionalTableClassNames(column.props.config.additionalClassNames, rowData)
        }
        return (
            <React.Fragment>
                <span className={className}>
                {rowData && rowData.status}
                </span>
                {rowData && props.column && props.column.props && props.column.props.enableRenewLinkFor &&
                    props.column.props.enableRenewLinkFor.includes(rowData[props.field])
                    && <> - <a href="javascript:void(0)" onClick={() => this.adminOnBehalf("renew", rowData)}>Renew</a></>}

                {rowData && props.column && props.column.props && props.column.props.enableJoinLinkFor &&
                    props.column.props.enableJoinLinkFor.includes(rowData[props.field])
                    && <> - <a href="javascript:void(0)" onClick={() => this.adminOnBehalf("join", rowData)}>Join</a></>}
            </React.Fragment>
        );
    }

    dateBodyTemplate = (rowData, props) => {
        let className
        const { column } = props
        if(column && column.props && column.props.config && column.props.config.additionalClassNames && column.props.config.additionalClassNames.length) {
            className = getAdditionalTableClassNames(column.props.config.additionalClassNames, rowData)
        }
        if (rowData && rowData.expiryDate && !rowData.inValidDate) {
            let date = getFormattedDate(rowData.expiryDate, DATE_FORMAT_DDMMYYYY_WITH_SPACE)
            rowData.expiryDate = new Date(date)
            if(date.endsWith("2099")){
                return   <span className={className}>Life </span>
            }
            else{
              
                return   <span className={className}>{getFormattedDate(rowData.expiryDate, DATE_FORMAT_DDMMYYYY_WITH_SPACE)} </span>
            }

        }
        else {
            const relativeDate = getRelativeDate(getFormattedDate(getCurrentDate(),DATE_FORMAT_DDMMYYYY_WITH_SPACE),100000)
            const formattedDate = getFormattedDate(relativeDate,DATE_FORMAT_DDMMYYYY_WITH_SPACE,"DD-MM-YYYY")
            rowData.expiryDate = new Date(formattedDate)
            rowData.inValidDate = true

            return ""
        }
    }

    render() {
        const { field, className, t, globalFilter,
            exportFileName, exportStr, onValueChange } = this.props;
        return (
            <>
                {field && field.values &&
                    <FieldBank
                        field={{
                            fieldType: FIELDTYPE_TABLE,
                            globalFilter: globalFilter,
                            emptyMessage: t('extend_expiry.no_results_found'),
                            exportStr: exportStr,
                            exportFileName: exportFileName,
                            bodyTemplates: {
                                actionBodyTemplate: this.actionBodyTemplate,
                                groupTemplate: this.groupTemplate,
                                accountGroupTypeTemplate: this.accountGroupTypeTemplate,
                                tierBenefitsTemplate: this.tierBenefitsTemplate,
                                koruStatusTemplate: this.koruStatusTemplate,
                                dateBodyTemplate: this.dateBodyTemplate
                            },
                            onValueChange: onValueChange,
                            ...field
                        }}
                        className={className}
                    />
                }
                {this.deleteConfirmModal()}
            </>);
    }

}

const mapStateToProps = (state) => {
    return {
        defaultConfig: state.configurationReducer[CONFIG_SECTION_DEFAULT],
        masterEntityLookup: state.masterEntityDataReducer.masterEntityLookup,
        config: state.configurationReducer[CONFIG_SECTION_MANAGE_ACCOUNT_USERS],
        accountStatusList: state.masterData[ACCOUNT_STATUS] ? state.masterData[ACCOUNT_STATUS] : [],
        privilegesList: state.masterData[ACCOUNT_USER_PRIVILEGE] ? state.masterData[ACCOUNT_USER_PRIVILEGE] : [],
        masterEntityLookupFilters: state.masterEntityDataReducer.masterEntityLookupFilters,
        accountUsers: state.retrieveAccountUsersReducer.retrieveAccountUsers,
    }
}
const mapDispatchToProps = {
    fetchMasterData,
    deleteAccountUser,
    updateAccountUserPrivilege

}

export default withSuspense()(connect(mapStateToProps, mapDispatchToProps)(withTranslation()(AccountUsersTable)));