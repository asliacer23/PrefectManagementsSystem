import {
  getPrefectFlowProfileFromDatabase,
  getPrefectRecentClearanceRecordsFromDatabase,
} from "./databaseIntegrationService";

export async function getPrefectFlowProfile() {
  return getPrefectFlowProfileFromDatabase();
}

export async function getPrefectRecentClearanceRecords() {
  return getPrefectRecentClearanceRecordsFromDatabase(5);
}
