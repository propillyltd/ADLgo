# Demo Account Credentials

This document contains the login credentials for demo accounts. Use these to test all features of the ADLgo application.

## Demo Accounts

### Customer Account
- **Email:** stevietany@gmail.com
- **Password:** [Use your existing password]
- **Role:** Customer
- **Features to Test:**
  - Create delivery orders
  - View and accept bids from partners
  - Track deliveries in real-time
  - Chat with delivery partners
  - Pay bills (airtime, data, DSTV, electricity)
  - Rate completed deliveries
  - View order history

### Partner Account
- **Email:** stevenetana@gmail.com
- **Password:** [Use your existing password]
- **Role:** Delivery Partner
- **Features to Test:**
  - View available delivery jobs
  - Submit bids on open orders
  - Accept delivery assignments
  - Update delivery status
  - Chat with customers
  - Upload delivery proof
  - View earnings and statistics
  - Manage partner profile and verification

## Important Note

These accounts are already registered and have been populated with sample data. Simply login with the credentials above using your existing passwords.

## Sample Data

Once registered, the database contains sample data including:

- **3 Sample Orders** for the customer:
  - 1 completed delivery with rating
  - 1 in-transit delivery with chat history
  - 1 pending order open for bids

- **2 Sample Bids** from partner on pending orders

- **3 Sample Bill Payments:**
  - MTN Airtime - ₦1,000
  - Airtel Data - ₦2,000
  - EKEDC Electricity - ₦5,000

- **Partner Profile:**
  - Verification Status: Approved
  - Vehicle: Motorcycle
  - Completed Deliveries: 12
  - Average Rating: 4.8/5
  - Total Earnings: ₦45,000

- **Sample Messages** between customer and partner

- **Order Tracking History** for all orders

## Testing the Bidding System

1. Login as **Customer** (customer@demo.com)
2. View the pending order that's open for bids
3. See the 2 bids submitted by the partner
4. Accept one of the bids to assign the partner

5. Login as **Partner** (partner@demo.com)
6. View available jobs (orders open for bidding)
7. Submit new bids on available orders
8. View accepted deliveries and manage them

## Testing Chat & Tracking

1. Login as **Customer**
2. Go to Orders and select the in-transit delivery
3. Open chat to see message history
4. View live tracking on the map
5. See the delivery status timeline

6. Login as **Partner**
7. Go to active deliveries
8. Update delivery status
9. Chat with customer
10. Upload delivery proof when completed

## Testing Bill Payments

1. Login as **Customer**
2. Go to Bills section
3. Select a service (Airtime, Data, DSTV, or Electricity)
4. Enter details and amount
5. Complete payment
6. View transaction history

## Security Notes

- These are DEMO accounts for testing purposes only
- Never use these credentials in a production environment
- Change passwords after initial setup if deploying to production
- Sample data includes realistic but fictional information

## Troubleshooting

If demo accounts don't have sample data:
1. Ensure you registered with exact emails above
2. Check that migrations ran successfully
3. Verify database connection in .env file

For any issues, check the app console for error messages.

---

**Last Updated:** 2025-10-28
