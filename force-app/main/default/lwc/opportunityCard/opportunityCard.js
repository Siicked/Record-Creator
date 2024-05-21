import { LightningElement, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import getOppDetails from '@salesforce/apex/OpportunityListController.getOppDetails';
import oppCreator from '@salesforce/apex/CreateOppController.oppCreator';
import searchAccounts from '@salesforce/apex/AccountLookupController.searchAccounts';
import refreshOpportunities from '@salesforce/apex/OpportunityListController.refreshOpportunities';


const LIMIT_COUNT = 10;

export default class OpportunityCard extends LightningElement {
    @track opps = [];
    @track accounts = [];
    @track error;
    @track isLoading = false;
    @track selectedOption = 'All Opportunities';
    @track showNewCasePanel = false;
    @track oppnameValue;
    @track selectedAccount;
    @track selectedStage;
    @track selectedDate;
    @track isRefreshing = false;
    minDate;
    wiredOppsResult;

    options = [
        { label: 'All Opportunities', value: 'All Opportunities' },
        { label: 'New This Week', value: 'New This Week' },
        { label: 'Closing This Month', value: 'Closing This Month' },
        { label: 'Closing Next Month', value: 'Closing Next Month' }
    ];

    stages = [
        { label: 'Prospecting', value: 'Prospecting' },
        { label: 'Qualification', value: 'Qualification' },
        { label: 'Closed Won', value: 'Closed Won' },
        { label: 'Closed Lost', value: 'Closed Lost' }
    ];

    handleOptionChange(event) {
        this.selectedOption = event.detail.value;
        this.loadOpps();
    }

    openNewCasePanel() {
        this.showNewCasePanel = true;
    }

    closeNewCasePanel() {
        this.showNewCasePanel = false;
    }

    handleInputChangeName(event) {
        this.oppnameValue = event.target.value;
    }

    handleInputChange(event) {
    const field = event.target.name;
    console.log(`Field changed: ${field}, Value: ${event.target.value}`);
    if (field === 'accountName') {
        this.accountName = event.target.value;
    } else if (field === 'oppName') {
        this.oppName = event.target.value;
    } else if (field === 'closeDate') {
        this.closeDate = event.target.value;
    } else if (field === 'stage') {
        this.stage = event.target.value;
    }
}

connectedCallback() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    this.minDate = `${yyyy}-${mm}-${dd}`;
}

handleDateChange(event) {
    this.selectedDate = event.target.value;
    const selectedEvent = new CustomEvent('datechange', {
        detail: {
            date: this.selectedDate
        }
    });
    this.dispatchEvent(selectedEvent);
}



    loadOpps() {
        this.isLoading = true;
        getOppDetails({ oppType: this.selectedOption, limitCount: LIMIT_COUNT })
            .then(result => {
                console.log('Opportunities loaded successfully:', result);
                this.opps = result;
                this.error = undefined;
            })
            .catch(error => {
                console.error('Error loading opportunities:', error);
                this.error = error;
                this.opps = [];
            })
            .finally(() => {
                this.isLoading = false;
            });
    }

    @wire(getOppDetails, { oppType: '$selectedOption', limitCount: LIMIT_COUNT })
    wiredOpps(result) {
        this.wiredOppsResult = result;
        if (result.data) {
            this.opps = result.data;
            this.error = undefined;
        } else if (result.error) {
            this.error = result.error;
            this.opps = [];
        }
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

        
        handleSave() {
            if (!this.selectedAccount || !this.selectedAccount.Name) {
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Error',
                    message: 'Please select an account.',
                    variant: 'error'
                }));
                return;
            }
            if (!this.oppName) {
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Error',
                    message: 'Please enter the opportunity name.',
                    variant: 'error'
                }));
                return;
            }
            if (!this.closeDate) {
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Error',
                    message: 'Please select the close date.',
                    variant: 'error'
                }));
                return;
            }
            if (!this.stage) {
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Error',
                    message: 'Please select the stage.',
                    variant: 'error'
                }));
                return;
            }
        
            oppCreator({ 
                accountName: this.selectedAccount.Name,
                oppName: this.oppName,
                closeDate: this.closeDate,
                stage: this.stage
            })
            .then(result => {
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Success',
                    message: 'Opp created successfully.',
                    variant: 'success'
                }));
                this.closeNewCasePanel();
        
                console.log('Caso creado con éxito:', result);
            })
            .catch(error => {
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Error',
                    message: 'Error creating opp: ' + error.body.message,
                    variant: 'error'
                }));
        
                console.error('Error al crear el caso:', error);
            });
        }

handleRefreshClick() {
    this.isRefreshing = true;
    refreshOpportunities()
        .then(() => {
            return refreshApex(this.wiredOppsResult);
        })
        .then(() => {
            console.log('Opps refreshed successfully');
        })
        .catch(error => {
            console.error('Error refreshing Opps:', error);
        })
        .finally(() => {
            this.isRefreshing = false;
        });
}
}

