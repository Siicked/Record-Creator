public with sharing class OpportunityListController {
    @AuraEnabled(cacheable=true)
    public static List<OppWrapper> getOppDetails(String oppType, Integer limitCount) {
        List<OppWrapper> oppDetails = new List<OppWrapper>();

        String query = 'SELECT Id, Account.Name, Name, CloseDate, StageName FROM Opportunity ';

        Boolean isNewThisWeek = oppType == 'New This Week';
        Boolean isClosingThisMonth = oppType == 'Closing This Month';
        Boolean isClosingNextMonth = oppType == 'Closing Next Month';
        Date startDate;
        Date endDate;

        if (isNewThisWeek) {
            startDate = Date.today().toStartOfWeek();
            endDate = startDate.addDays(7);
        } else if (isClosingThisMonth) {
            startDate = Date.today().toStartOfMonth();
            endDate = startDate.addMonths(1);
        } else if (isClosingNextMonth) {
            startDate = Date.today().toStartOfMonth().addMonths(1);
            endDate = startDate.addMonths(1).toStartOfMonth().addDays(-1);
        }
        
        if (isNewThisWeek || isClosingThisMonth || isClosingNextMonth) {
            query += 'WHERE ';
            if (isNewThisWeek) {
                query += 'CreatedDate >= :startDate AND CreatedDate < :endDate ';
            }
            if (isClosingThisMonth || isClosingNextMonth) {
                if (isNewThisWeek) {
                    query += 'AND ';
                }
                query += 'CloseDate >= :startDate ';
                if (isClosingThisMonth) {
                    query += 'AND CloseDate < :endDate ';
                }
            }
        }

        query += 'ORDER BY CreatedDate DESC ';
        query += 'LIMIT :limitCount';

for (Opportunity opp : Database.query(query)) {
    oppDetails.add(new OppWrapper(opp.Account.Name, opp.Name, opp.CloseDate, opp.StageName));
}

return oppDetails;
    }

    @AuraEnabled
public static void refreshOpportunities() {
    String query = 'SELECT Id, Account.Name, Name, CloseDate, StageName FROM Opportunity ORDER BY CreatedDate DESC LIMIT 10';
    
    List<OppWrapper> updatedOpportunities = new List<OppWrapper>();
    for (Opportunity opp : Database.query(query)) {
        updatedOpportunities.add(new OppWrapper(opp.Account.Name, opp.Name, opp.CloseDate, opp.StageName));
    }
    System.debug('Updated Opportunities: ' + updatedOpportunities);
}


    public class OppWrapper {
        @AuraEnabled
        public String accountName;
        @AuraEnabled
        public String oppName;
        @AuraEnabled
        public Date closeDate;
        @AuraEnabled
        public String stage;
    
        public OppWrapper(String accountName, String oppName, Date closeDate, String stage) {
            this.accountName = accountName;
            this.oppName = oppName;
            this.closeDate = closeDate;
            this.stage = stage;
        }
    }    
}
