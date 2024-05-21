public with sharing class AccountLookupController {

    @AuraEnabled(cacheable=true)
    public static List<Account> searchAccounts(String searchTerm) {
        String query = '%' + searchTerm + '%';
        
        return [
            SELECT Id, Name
            FROM Account
            WHERE Name LIKE :query
            LIMIT 4];
    }
}
