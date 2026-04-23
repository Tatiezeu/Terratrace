// ─── Land Plots ──────────────────────────────────────────────────────────────
export const mockLandPlots = [
  { id: "1", landCode: "10005-05-54321-7890", image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800", status: "clear", price: 12500000, location: "Douala, Littoral", area: 500, owner: "Jean-Claude Mbarga", ownerCNI: "54321", matterportId: "abc123xyz", gpsCoordinates: { lat: 4.0511, lng: 9.7679 }, ownershipHistory: [{ date: "2020-03-15", owner: "Jean-Claude Mbarga", transferType: "Purchase" }, { date: "2010-06-20", owner: "Estate of Mbarga", transferType: "Inheritance" }] },
  { id: "2", landCode: "10005-02-54322-1234", image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800", status: "under_transfer", price: 45000000, location: "Yaoundé, Centre", area: 1200, owner: "Marie Claire Ngo", ownerCNI: "54322", gpsCoordinates: { lat: 3.848, lng: 11.5021 }, ownershipHistory: [{ date: "2018-11-05", owner: "Marie Claire Ngo", transferType: "Purchase" }] },
  { id: "3", landCode: "00050-08-54323-5678", image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800", status: "disputed", price: 8500000, location: "Bafoussam, West", area: 350, owner: "Samuel Eto'o (Heirs)", ownerCNI: "54323", gpsCoordinates: { lat: 5.4777, lng: 10.4176 }, ownershipHistory: [{ date: "2022-01-10", owner: "Samuel Eto'o (Heirs)", transferType: "Succession" }] },
  { id: "4", landCode: "00050-01-87654-3210", image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800", status: "clear", price: 5200000, location: "Ngaoundéré, Adamaoua", area: 2400, owner: "Moussa Hamidou", ownerCNI: "87654", matterportId: "SxQL3iGyvJ5", gpsCoordinates: { lat: 7.3236, lng: 13.5842 }, ownershipHistory: [{ date: "2021-08-14", owner: "Moussa Hamidou", transferType: "Purchase" }, { date: "2015-03-22", owner: "Government of Cameroon", transferType: "Allocation" }] },
  { id: "5", landCode: "10005-03-33221-5544", image: "https://images.unsplash.com/photo-1516156008625-3a9d6067fab5?w=800", status: "clear", price: 18000000, location: "Bertoua, East", area: 850, owner: "Ferdinand Ngoh", ownerCNI: "33221", matterportId: "abc456deg", gpsCoordinates: { lat: 4.5779, lng: 13.6847 }, ownershipHistory: [{ date: "2019-11-12", owner: "Ferdinand Ngoh", transferType: "Purchase" }] },
  { id: "6", landCode: "10005-10-88776-2211", image: "https://images.unsplash.com/photo-1586348943529-beaae6c28db9?w=800", status: "flagged", price: 35000000, location: "Buea, South West", area: 1500, owner: "Ekoko Mukete", ownerCNI: "88776", matterportId: "", gpsCoordinates: { lat: 4.1593, lng: 9.2435 }, ownershipHistory: [{ date: "2023-01-05", owner: "Ekoko Mukete", transferType: "Registration" }] },
  { id: "7", landCode: "10005-06-77123-9900", image: "https://images.unsplash.com/photo-1543158181-e6f9f6712055?w=800", status: "under_transfer", price: 22000000, location: "Garoua, North", area: 700, owner: "Alhadji Bello", ownerCNI: "77123", gpsCoordinates: { lat: 9.2982, lng: 13.3946 }, ownershipHistory: [{ date: "2023-07-04", owner: "Alhadji Bello", transferType: "Purchase" }] },
  { id: "8", landCode: "00050-04-66543-4400", image: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800", status: "clear", price: 9800000, location: "Ebolowa, South", area: 900, owner: "Irène Mvondo", ownerCNI: "66543", matterportId: "xyz789abc", gpsCoordinates: { lat: 2.9, lng: 11.15 }, ownershipHistory: [{ date: "2017-04-22", owner: "Irène Mvondo", transferType: "Purchase" }] },
  { id: "9", landCode: "10005-07-55432-1122", image: "https://images.unsplash.com/photo-1504615755583-2916b52192a3?w=800", status: "disputed", price: 31000000, location: "Bamenda, North West", area: 1100, owner: "Fru Tande", ownerCNI: "55432", gpsCoordinates: { lat: 5.9597, lng: 10.1455 }, ownershipHistory: [{ date: "2016-09-30", owner: "Fru Tande", transferType: "Succession" }] },
  { id: "10", landCode: "10005-09-44321-3388", image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800", status: "flagged", price: 16500000, location: "Maroua, Far North", area: 600, owner: "Hadja Mariam", ownerCNI: "44321", gpsCoordinates: { lat: 10.5922, lng: 14.3167 }, ownershipHistory: [{ date: "2020-12-01", owner: "Hadja Mariam", transferType: "Registration" }] },
];

// ─── Officers ─────────────────────────────────────────────────────────────────
export const mockOfficers = [
  { id: "off1", name: "André Fotso", role: "Notary", matricule: "CH10001", jurisdiction: "Douala I", email: "a.fotso@terratrace.cm", phone: "+237 677 001 001", status: "active" },
  { id: "off2", name: "Claire Essomba", role: "Notary", matricule: "CH10002", jurisdiction: "Yaoundé VI", email: "c.essomba@terratrace.cm", phone: "+237 677 001 002", status: "active" },
  { id: "off3", name: "Paul Njoh", role: "LRO", matricule: "CM29938", jurisdiction: "Bafoussam", email: "p.njoh@terratrace.cm", phone: "+237 677 001 003", status: "active" },
  { id: "off4", name: "Bello Maikanti", role: "LRO", matricule: "CM29939", jurisdiction: "Garoua", email: "b.maikanti@terratrace.cm", phone: "+237 677 001 004", status: "active" },
  { id: "off5", name: "Fatima Al-Nour", role: "Notary", matricule: "CH10003", jurisdiction: "Maroua", email: "f.alnour@terratrace.cm", phone: "+237 677 001 005", status: "active" },
  { id: "off6", name: "Henri Tchiamba", role: "LRO", matricule: "CM29940", jurisdiction: "Bertoua", email: "h.tchiamba@terratrace.cm", phone: "+237 677 001 006", status: "suspended" },
  { id: "off7", name: "Grace Mbah", role: "Notary", matricule: "CH10004", jurisdiction: "Bamenda", email: "g.mbah@terratrace.cm", phone: "+237 677 001 007", status: "active" },
  { id: "off8", name: "Saidou Yaya", role: "LRO", matricule: "CM29941", jurisdiction: "Ngaoundéré", email: "s.yaya@terratrace.cm", phone: "+237 677 001 008", status: "active" },
];

// ─── System Accounts (for Settings) ──────────────────────────────────────────
export const mockSystemAccounts = [
  { id: "acc1", name: "Marie Kouadio", role: "Super Admin", email: "marie.k@terratrace.cm", tfa: true, status: "active", lastLogin: "2026-04-23 10:42", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marie" },
  { id: "acc2", name: "Jean Dupont", role: "Notary", email: "jean.d@notary.cm", tfa: false, status: "active", lastLogin: "2026-04-22 09:15", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jean" },
  { id: "acc3", name: "Alice Beka", role: "Landowner", email: "alice.b@gmail.com", tfa: true, status: "suspended", lastLogin: "2026-04-20 14:22", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice" },
  { id: "acc4", name: "Robert Cam", role: "LRO", email: "robert.c@lro.cm", tfa: true, status: "active", lastLogin: "2026-04-23 08:05", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Robert" },
  { id: "acc5", name: "Fatou Diallo", role: "Client", email: "fatou.d@gmail.com", tfa: false, status: "active", lastLogin: "2026-04-21 16:30", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Fatou" },
  { id: "acc6", name: "Emmanuel Kotto", role: "Notary", email: "e.kotto@notary.cm", tfa: true, status: "suspended", lastLogin: "2026-04-15 11:00", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emmanuel" },
  { id: "acc7", name: "Cécile Mbarga", role: "LRO", email: "c.mbarga@lro.cm", tfa: false, status: "active", lastLogin: "2026-04-23 07:55", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Cecile" },
];

// ─── Transfer Requests ────────────────────────────────────────────────────────
export const mockTransferRequests = [
  { id: "req1", landCode: "10005-05-54321-7890", buyerName: "Ousmanou Bello", buyerCNI: "99887", status: "pending", transferType: "purchase", notaryId: "off1", submittedAt: "2024-05-18" },
  { id: "req2", landCode: "10005-02-54322-1234", buyerName: "Felicite Abena", buyerCNI: "44556", status: "fee_pending", transferType: "inheritance", notaryId: "off2", submittedAt: "2024-05-19" },
  { id: "req3", landCode: "00050-08-54323-5678", buyerName: "Ibrahim Moussa", buyerCNI: "55667", status: "published", transferType: "purchase", notaryId: "off1", submittedAt: "2024-05-10" },
  { id: "req4", landCode: "10005-06-77123-9900", buyerName: "Emmanuel Tabi", buyerCNI: "11223", status: "notary_verified", transferType: "purchase", notaryId: "off5", submittedAt: "2024-05-20" },
  { id: "req5", landCode: "10005-10-88776-2211", buyerName: "Ngono Lise", buyerCNI: "33445", status: "pending", transferType: "inheritance", notaryId: "off2", submittedAt: "2024-05-21" },
];

// ─── Public Notices ───────────────────────────────────────────────────────────
export const mockNotices = [
  { id: "n1", landCode: "00050-08-54323-5678", title: "Public Notice: Transfer of Plot 5678", location: "Bafoussam, West", region: "West", category: "Transfer", publishedAt: "2024-05-10", expiresAt: "2024-06-10", status: "active", image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800", lroName: "Paul Njoh", description: "Notice of intention to transfer ownership of registered public land plot in Bafoussam. Any person having a claim or objection should report to the local Land Registry office within 30 days." },
  { id: "n2", landCode: "10005-02-54322-1234", title: "Succession Notice: Yaoundé VI", location: "Yaoundé, Centre", region: "Centre", category: "Inheritance", publishedAt: "2024-05-15", expiresAt: "2024-06-15", status: "active", image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800", lroName: "Paul Njoh", description: "Notice of inheritance transfer for private land in Yaoundé VI. Objections must be filed with the Registry Officer within the notice period." },
  { id: "n3", landCode: "10005-06-77123-9900", title: "Land Registration Notice: Garoua North", location: "Garoua, North", region: "North", category: "Registration", publishedAt: "2024-04-20", expiresAt: "2024-05-20", status: "expired", image: "https://images.unsplash.com/photo-1543158181-e6f9f6712055?w=800", lroName: "Bello Maikanti", description: "Registration of first title for Plot 9900 in Garoua. Any opposition must be submitted in writing to the Garoua LRO." },
  { id: "n4", landCode: "10005-09-44321-3388", title: "Disputed Title Notice: Maroua Far North", location: "Maroua, Far North", region: "Far North", category: "Dispute", publishedAt: "2024-05-01", expiresAt: "2024-06-01", status: "active", image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800", lroName: "Saidou Yaya", description: "Notice of contested land title in Maroua. Multiple claimants have been identified. The matter is under LRO review." },
  { id: "n5", landCode: "00050-04-66543-4400", title: "Transfer Notice: Ebolowa South", location: "Ebolowa, South", region: "South", category: "Transfer", publishedAt: "2024-05-18", expiresAt: "2024-06-18", status: "active", image: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800", lroName: "Paul Njoh", description: "Notice of sale transfer for Plot 4400 in Ebolowa. The new owner is a Cameroon national and all documents are duly certified." },
];

// ─── Activity Logs ────────────────────────────────────────────────────────────
export const mockActivityLogs = [
  { id: "log1", user: "Marie Kouadio", action: "Login Successful", time: "2026-04-23 10:42:15", ip: "197.234.1.42", role: "Super Admin", status: "success" },
  { id: "log2", user: "Jean Dupont", action: "Password Reset", time: "2026-04-23 09:15:02", ip: "197.234.1.88", role: "Notary", status: "success" },
  { id: "log3", user: "Unknown", action: "Login Failed (Attempt 1)", time: "2026-04-22 23:55:12", ip: "203.0.113.5", role: "—", status: "failed" },
  { id: "log4", user: "Alice Beka", action: "Account Suspended", time: "2026-04-22 14:22:11", ip: "197.234.2.12", role: "Landowner", status: "warning" },
  { id: "log5", user: "Robert Cam", action: "New Plot Registered", time: "2026-04-22 08:05:33", ip: "197.234.1.77", role: "LRO", status: "success" },
  { id: "log6", user: "Unknown", action: "Login Failed (Attempt 3)", time: "2026-04-21 20:14:01", ip: "203.0.113.9", role: "—", status: "failed" },
  { id: "log7", user: "Fatou Diallo", action: "Transfer Request Submitted", time: "2026-04-21 16:30:45", ip: "197.234.3.01", role: "Client", status: "success" },
  { id: "log8", user: "Cécile Mbarga", action: "Notice Published", time: "2026-04-21 11:22:00", ip: "197.234.1.55", role: "LRO", status: "success" },
];
