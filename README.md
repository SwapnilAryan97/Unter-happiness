# Unter-happiness

### Running the project file

From the root directory:

```bash
chmod +x run.sh
./run.sh install
./run.sh build
./run.sh start
```

---

# Unter

To design a data model for the "Unter" taxi platform, we'll identify the key entities, define their relationships, and create tables to accommodate all the system requirements efficiently.

---

### **Key Entities and Relationships**

1. **Drivers**
2. **Passengers**
3. **Driver Shifts**
4. **Rides**
5. **Ride Passengers**
   - **Ratings**
   - **Tips**

---

### **Data Model**

#### **1. Drivers Table**

- **Purpose**: Store driver information and cumulative rating data.
- **Fields**:
  - `driver_id` (Primary Key)
  - `name`
  - `contact_info`
  - `accumulated_rating_points` (Total sum of all rating points received)
  - `rating_count` (Total number of ratings received)

#### **2. Passengers Table**

- **Purpose**: Store passenger information.
- **Fields**:
  - `passenger_id` (Primary Key)
  - `name`
  - `contact_info`

#### **3. Driver_Shifts Table**

- **Purpose**: Record when drivers start and end their work shifts.
- **Fields**:
  - `shift_id` (Primary Key)
  - `driver_id` (Foreign Key to Drivers)
  - `start_time`
  - `end_time`

#### **4. Rides Table**

- **Purpose**: Store information about each ride.
- **Fields**:
  - `ride_id` (Primary Key)
  - `driver_id` (Foreign Key to Drivers)
  - `start_time`
  - `end_time`
  - `distance`
  - `duration`
  - `fare_amount`

#### **5. Ride_Passengers Table**

- **Purpose**: Associate passengers with rides and record tips and ratings.
- **Fields**:
  - `ride_id` (Foreign Key to Rides)
  - `passenger_id` (Foreign Key to Passengers)
  - `tip_amount`
  - `rating_value` (1-5 stars)
- **Primary Key**: Composite key of `ride_id` and `passenger_id`

---

### **Considerations and Assumptions**

1. **Driver Shifts**:

   - **Assumption**: Drivers can start and end multiple shifts within a day.
   - **Reasoning**: To track drivers' working hours accurately and determine who worked on a particular day.

2. **Rides**:

   - **Fare Calculation Factors**:
     - Time of day
     - Mileage
     - Duration
     - Number of passengers
   - **Assumption**: The application calculates `fare_amount` based on these factors before storing it.
   - **Time of Day**:
     - Stored within `start_time` for fare calculations and reporting.

3. **Ride_Passengers**:

   - **Tips**:
     - **Assumption**: Each passenger can individually tip the driver.
     - **Reasoning**: Allows precise tracking of tips per passenger per ride.
   - **Ratings**:
     - **Assumption**: Ratings are given by passengers per ride.
     - **Reasoning**: Enables accumulation of ratings for calculating average driver ratings.
   - **Number of Passengers**:
     - Derived by counting entries in `Ride_Passengers` for a given `ride_id`.

4. **Ratings**:

   - **Storage**: Individual ratings are stored to allow recalculations if needed.
   - **Accumulation**:
     - `accumulated_rating_points` and `rating_count` in the Drivers table are updated whenever a new rating is added.
     - **Assumption**: This provides efficient retrieval of average ratings without recalculating each time.

5. **Data Integrity and Performance**:

   - **Assumption**: Storing accumulated values balances performance and data integrity.
   - **Reasoning**: Avoids performance hits from on-the-fly calculations over large datasets.

6. **Passengers**:
   - **Assumption**: Passengers may share rides, and their interactions with drivers (tips and ratings) are independent.

---

### **Example Queries**

1. **Drivers Who Worked Today**:

   ```sql
   SELECT DISTINCT driver_id
   FROM Driver_Shifts
   WHERE DATE(start_time) = CURDATE();
   ```

2. **Number of Rides Per Driver Today**:

   ```sql
   SELECT driver_id, COUNT(*) AS ride_count
   FROM Rides
   WHERE DATE(start_time) = CURDATE()
   GROUP BY driver_id;
   ```

3. **Total Revenue Per Driver Today**:

   ```sql
   SELECT driver_id, SUM(fare_amount) AS total_revenue
   FROM Rides
   WHERE DATE(start_time) = CURDATE()
   GROUP BY driver_id;
   ```

4. **Total Tips Per Driver Today**:

   ```sql
   SELECT r.driver_id, SUM(rp.tip_amount) AS total_tips
   FROM Rides r
   JOIN Ride_Passengers rp ON r.ride_id = rp.ride_id
   WHERE DATE(r.start_time) = CURDATE()
   GROUP BY r.driver_id;
   ```

5. **Driver with Highest and Lowest Rating**:

   ```sql
   SELECT driver_id, (accumulated_rating_points / rating_count) AS average_rating
   FROM Drivers
   ORDER BY average_rating DESC
   LIMIT 1; -- Highest rating

   SELECT driver_id, (accumulated_rating_points / rating_count) AS average_rating
   FROM Drivers
   ORDER BY average_rating ASC
   LIMIT 1; -- Lowest rating
   ```

---

### **Rationale Behind Design Choices**

- **Normalization**: The data model is normalized to at least the third normal form to eliminate redundancy and ensure data integrity.
- **Performance**:
  - **Aggregated Fields**: Storing `accumulated_rating_points` and `rating_count` in the `Drivers` table enhances performance for queries involving average ratings.
  - **Indexing**: Primary and foreign keys facilitate efficient joins and lookups.
- **Flexibility**:
  - By storing individual tips and ratings in the `Ride_Passengers` table, we maintain the flexibility to adapt to future requirements, such as analyzing passenger behavior or handling disputes.
- **Simplicity**:
  - The model avoids unnecessary complexity by deriving calculable fields (e.g., number of passengers per ride) rather than storing them redundantly.

---

# Option to add Driver rating to passenger

To modify the data model to accommodate drivers leaving 1-5 star reviews for passengers, we'll need to adjust the existing tables to store and manage these additional ratings. The goal is to ensure that the system can track and calculate the average rating of each passenger based on driver feedback.

---

### **Updated Data Model**

#### **1. Passengers Table (Modified)**

- **Purpose**: Store passenger information and accumulate their ratings from drivers.
- **Fields**:
  - `passenger_id` (Primary Key)
  - `name`
  - `contact_info`
  - `accumulated_rating_points`
  - `rating_count`

#### **2. Ride_Passengers Table (Modified)**

- **Purpose**: Associate passengers with rides and record interactions, including tips and mutual ratings.
- **Fields**:
  - `ride_id` (Foreign Key to Rides)
  - `passenger_id` (Foreign Key to Passengers)
  - `tip_amount`
  - `passenger_rating` (1-5 stars given to passenger)
  - `driver_rating` (1-5 stars given to driver)
- **Primary Key**: Composite key of `ride_id` and `passenger_id`

#### **Other Tables**

- **Drivers Table**: Remains the same, already storing accumulated ratings from passengers.
- **Driver_Shifts Table**: No changes needed.
- **Rides Table**: No changes needed.

---

### **Considerations and Assumptions**

1. **Driver Ratings for Passengers**:

   - **Assumption**: Drivers can rate each passenger individually after each ride.
   - **Reasoning**: This allows the platform to monitor passenger behavior and maintain quality of service.

2. **Data Storage**:

   - **Driver Ratings**: Added `driver_rating_value` to the `Ride_Passengers` table to keep all ride-related interactions centralized.
   - **Accumulated Ratings**: Added `accumulated_rating_points` and `rating_count` to the `Passengers` table to efficiently compute average ratings.

3. **Privacy and Compliance**:
   - **Assumption**: Ratings are handled in compliance with privacy laws and platform policies.

---

### **How the Updated Model Addresses the New Requirement**

- **Storing Driver Ratings**: By adding `driver_rating_value` to the `Ride_Passengers` table, drivers can rate passengers per ride, and the system can track these ratings effectively.
- **Calculating Average Passenger Ratings**: With `accumulated_rating_points` and `rating_count` in the `Passengers` table, the system can quickly compute each passenger's average rating.

- **Queries and Reporting**: The model supports new queries to find passengers with the highest or lowest ratings, similar to drivers.

---

### **Example Queries with the Updated Model**

1. **When a Driver Rates a Passenger**:

   Update the passenger's accumulated ratings when a new driver rating is added.

   ```sql
   -- Insert driver rating into Ride_Passengers table
   INSERT INTO Ride_Passengers (ride_id, passenger_id, driver_rating_value)
   VALUES ({ride_id}, {passenger_id}, {driver_rating_value});

   -- Update accumulated ratings in Passengers table
   UPDATE Passengers
   SET
     accumulated_rating_points = accumulated_rating_points + {driver_rating_value},
     rating_count = rating_count + 1
   WHERE passenger_id = {passenger_id};
   ```

2. **Calculate Average Passenger Rating**:

   ```sql
   SELECT passenger_id, (accumulated_rating_points / rating_count) AS average_rating
   FROM Passengers;
   ```

3. **Find Passenger with Highest and Lowest Ratings**:

   ```sql
   -- Highest rated passenger
   SELECT passenger_id, (accumulated_rating_points / rating_count) AS average_rating
   FROM Passengers
   WHERE rating_count > 0
   ORDER BY average_rating DESC
   LIMIT 1;

   -- Lowest rated passenger
   SELECT passenger_id, (accumulated_rating_points / rating_count) AS average_rating
   FROM Passengers
   WHERE rating_count > 0
   ORDER BY average_rating ASC
   LIMIT 1;
   ```

4. **Total Number of Ratings Received by a Passenger Today**:

   ```sql
   SELECT rp.passenger_id, COUNT(*) AS rating_count_today
   FROM Ride_Passengers rp
   JOIN Rides r ON rp.ride_id = r.ride_id
   WHERE rp.driver_rating_value IS NOT NULL
     AND DATE(r.end_time) = CURDATE()
   GROUP BY rp.passenger_id;
   ```

---

### **Rationale Behind Design Changes**

- **Data Normalization**: Keeping driver ratings within the `Ride_Passengers` table maintains normalization and ensures that each rating is directly associated with a specific ride and passenger.

- **Performance Efficiency**: Storing accumulated ratings in the `Passengers` table allows for quick retrieval of average ratings without recalculating each time, improving query performance.

- **Scalability**: The model can handle an increasing number of ratings and passengers without significant changes to the database structure.

- **Consistency**: The approach mirrors how passenger ratings of drivers are handled, providing a consistent data model.

---

### **Updated System Requirements Fulfillment**

- **Identifying Passengers with Specific Ratings**: The system can now report on passengers' average ratings, helping to identify those with the highest and lowest ratings.

- **Enhanced Reporting**: Both driver and passenger ratings can be included in daily reports, offering a more comprehensive view of platform interactions.

- **Maintaining Existing Functionality**: The original requirements are still met, with additional capabilities added seamlessly.

---

### **Assumptions Summary**

- **One Rating per Ride**: Drivers rate passengers once per ride, even if the ride is shared among multiple passengers.

- **Individual Ratings**: Each passenger receives an individual rating from the driver, not a collective rating for the group.

- **Immediate Update**: Ratings are recorded and accumulated ratings are updated immediately after the ride ends.

---
