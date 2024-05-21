import { LightningElement, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import getCaseDetails from '@salesforce/apex/casesCard.getCaseDetails';
import refreshCases from '@salesforce/apex/casesCard.refreshCases';
import searchAccounts from '@salesforce/apex/AccountLookupController.searchAccounts';
import createCase from '@salesforce/apex/createCase.caseCreator';

const LIMIT_COUNT = 10;

export default class CasesCard extends LightningElement {
    @track cases = [];
    @track error;
    @track selectedOption = 'My Cases';
    @track isLoading = false;
    @track isRefreshing = false;
    @track showNewCasePanel = false;
    @track selectedAccount;
    @track selectedValue;
    @track selectedPrior;
    @track selectedOrigin;
    @track subjectValue;
    @track accounts = [];
    @track selectedType;
    wiredCasesResult;

    displayClass = 'list-hidden';

    options = [
        { label: 'My Cases', value: 'My Cases' },
        { label: 'Opened Cases', value: 'Opened Cases' },
        { label: 'Closed Cases', value: 'Closed Cases' },
        { label: 'High Priority Cases', value: 'High Priority Cases' }
    ];

    values = [
        { label: 'New', value: 'New' },
        { label: 'Working', value: 'Working' },
        { label: 'Escalated', value: 'Escalated' },
    ];

    prioritys = [
        { label: 'Low', value: 'Low' },
        { label: 'Medium', value: 'Medium' },
        { label: 'High', value: 'High' }
    ];

    origins = [
        { label: 'Phone', value: 'Phone' },
        { label: 'Email', value: 'Email' },
        { label: 'Web', value: 'Web' }
    ];

    types = [
        { label: 'Mechanical', value: 'Mechanical' },
        { label: 'Electrical', value: 'Electrical' },
        { label: 'Electronic', value: 'Electronic' },
        { label: 'Structural', value: 'Structural' },
        { label: 'Other', value: 'Other' }
    ];
    
    handleInputChange(event) {
        const field = event.target.name;
        console.log(`Field changed: ${field}, Value: ${event.target.value}`);
        if (field === 'accountName') {
            this.accountName = event.target.value;
        } else if (field === 'status') {
            this.status = event.target.value;
        } else if (field === 'priority') {
            this.priority = event.target.value;
        } else if (field === 'origin') {
            this.origin = event.target.value;
        } else if (field === 'subject') {
            this.subject = event.target.value;
        } else if (field === 'type') {
            this.type = event.target.value;
        }
    }


    handleOptionChange(event) {
        this.selectedOption = event.detail.value;
        this.loadCases();
    }


    openNewCasePanel() {
        this.showNewCasePanel = true;
    }

    closeNewCasePanel() {
        this.showNewCasePanel = false;
    }


    handleInputChangeSubject(event) {
        this.subjectValue = event.target.value;
    }
    
    handleSave() {
        if (!this.selectedAccount || !this.selectedAccount.Name) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Error',
                message: 'Please select an account.',
                variant: 'error'
            }));
            return;
        }
    
        createCase({ 
        accountName: this.selectedAccount.Name,
        status: this.status,
        priority: this.priority,
        origin: this.origin,
        subject: this.subjectValue,
        type: this.type
        })
        .then(result => {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Success',
                message: 'Case created successfully.',
                variant: 'success'
            }));
            this.closeNewCasePanel();
        
            console.log('Caso creado con éxito:', result);
        })
        .catch(error => {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Error',
                message: 'Error creating case: ' + error.body.message,
                variant: 'error'
            }));
        
            console.error('Error al crear el caso:', error);
        });
    }


    loadCases() {
        this.isLoading = true;
        getCaseDetails({ caseType: this.selectedOption, limitCount: LIMIT_COUNT })
            .then(result => {
                console.log('Cases loaded successfully:', result);
                this.cases = result;
                this.error = undefined;
            })
            .catch(error => {
                console.error('Error loading cases:', error);
                this.error = error;
                this.cases = [];
            })
            .finally(() => {
                this.isLoading = false;
            });
    }

    @wire(getCaseDetails, { caseType: '$selectedOption', limitCount: LIMIT_COUNT })
    wiredCases(result) {
        this.wiredCasesResult = result;
        if (result.data) {
            this.cases = result.data;
            this.error = undefined;
        } else if (result.error) {
            this.error = result.error;
            this.cases = [];
        }
    }

    handleRefreshClick() {
        this.isRefreshing = true;
        refreshCases()
            .then(() => {
                return refreshApex(this.wiredCasesResult);
            })
            .then(() => {
                console.log('Cases refreshed successfully');
            })
            .catch(error => {
                console.error('Error refreshing cases:', error);
            })
            .finally(() => {
                this.isRefreshing = false;
            });
    }

    

    handleListMouseLeave() {
        const listBox = this.template.querySelector('.slds-dropdown');
        if (this.accounts.length > 0) {
            listBox.classList.add('list-visible');
            listBox.classList.remove('list-hidden');
        } else {
            listBox.classList.add('list-hidden');
            listBox.classList.remove('list-visible');
        }
    }



    handleAccountInputChange(event) {
        const searchTerm = event.target.value;
        console.log('Account search term:', searchTerm);
        if (searchTerm.length >= 2) {
            this.accountSearchTerm = searchTerm;
            this.fetchAccounts();
        } else {
            this.accounts = [];
        }
    }

    fetchAccounts() {
        console.log('Fetching accounts with search term:', this.accountSearchTerm);
        searchAccounts({ searchTerm: this.accountSearchTerm })
            .then(result => {
                console.log('Accounts fetched successfully:', result);
                this.accounts = result;
                this.error = undefined;
                const listBox = this.template.querySelector('.slds-dropdown');
                if (result.length > 0) {
                    listBox.classList.add('list-visible');
                    listBox.classList.remove('list-hidden');
                } else {
                    listBox.classList.add('list-hidden');
                    listBox.classList.remove('list-visible');
                }
            })
            .catch(error => {
                console.error('Error fetching accounts:', error);
                this.error = error;
                this.accounts = [];
            });
    }

    handleAccountSelect(event) {
        const accountId = event.currentTarget.dataset.id;
        const accountName = event.currentTarget.querySelector('.slds-listbox__option-text_entity').textContent;
        console.log('Account selected:', accountName);
        this.selectedAccount = { Id: accountId, Name: accountName };
        
        const inputField = this.template.querySelector('.slds-combobox__input');
    
        inputField.value = accountName;
    
        const listBox = this.template.querySelector('#listbox-account');
        listBox.classList.remove('list-visible');
        listBox.classList.add('list-hidden');
    }  
}
