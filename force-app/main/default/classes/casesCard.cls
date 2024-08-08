public with sharing class casesCard {
    
    @AuraEnabled(cacheable=true)
    public static List<CaseWrapper> getCaseDetails(String caseType, Integer limitCount) {
        List<CaseWrapper> caseDetails = new List<CaseWrapper>();

        String query = 'SELECT Id, Account.Name, CaseNumber, Contact.Email, Status, Priority, Origin, Type FROM Case ';
        if(caseType == 'My Cases') {
            query += 'WHERE OwnerId = \'' + UserInfo.getUserId() + '\' ';
        } else if(caseType == 'Opened Cases') {
            query += 'WHERE Status IN (\'New\', \'Working\', \'Escalated\') ';
        } else if(caseType == 'Closed Cases') {
            query += 'WHERE Status = \'Closed\' ';
        } else if(caseType == 'High Priority Cases') {
            query += 'WHERE Priority = \'High\' ';
        }
        query += 'ORDER BY CreatedDate DESC ';
        query += 'LIMIT :limitCount';
        for (Case c : Database.query(query)) {
            caseDetails.add(new CaseWrapper(c.Account.Name, c.CaseNumber, c.Contact.Email, c.Status, c.Priority, c.Origin, c.Type));
        }
        return caseDetails;
    }

    @AuraEnabled
    public static void refreshCases() {
        String query = 'SELECT Id, Account.Name, CaseNumber, Contact.Email, Status, Priority, Origin, Type FROM Case WHERE Status = \'New\' ORDER BY CreatedDate DESC LIMIT 10';
        
        List<CaseWrapper> updatedCases = new List<CaseWrapper>();
        for (Case c : Database.query(query)) {
            updatedCases.add(new CaseWrapper(c.Account.Name, c.CaseNumber, c.Contact.Email, c.Status, c.Priority, c.Origin, c.Type));
        }
        System.debug('Updated Cases: ' + updatedCases);
    }

    public class CaseWrapper {
        @AuraEnabled
        public String accountName;
        @AuraEnabled
        public String caseNumber;
        @AuraEnabled
        public String contactEmail;
        @AuraEnabled
        public String status;
        @AuraEnabled
        public String priority;
        @AuraEnabled
        public String origin;
        @AuraEnabled
        public Id type;


        public CaseWrapper(String accountName, String caseNumber, String contactEmail, String status, String priority, String origin, String type) {
            this.accountName = accountName;
            this.caseNumber = caseNumber;
            this.contactEmail = contactEmail;
            this.status = status;
            this.priority = priority;
            this.origin = origin;
            this.type = type;
        }
    }
}
