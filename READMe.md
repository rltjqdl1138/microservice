# microservice
<p>Microservice is web server architecture for managing high traffic volume</p>

<h2>level 0. Distributor</h2>
<p>It registers all microservers and Gateways</p>
<p>All microservers and Gateways are synchronized by distributor</p>

<h2>level 1. Gateway</h2>
<p>It translates simple API call to RESTful API calls for DB</p>
<p>If all transaction is done, responde to client</p>

<h2>level 2. Microserver</h2>
<p>now, there is only User DB</p>
<p>I use SQL Query but It can be replaced to DB API Call at any time</p>

<h2>level 3. Orient DB</h2>
<p>You need to install Orient DB and orient js</p>
<p>Other DB is fine too.</p>
