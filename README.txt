Connect Homey to your QNAP NAS.
You get an overview of important system properties such as CPU and memory usage, temperature, fan, firmware version.

By adding further NAS elements to Homey, the following data is provided:
- Ethernet interfaces: IP data, MAC, TX, RX, errors, etc.
- Hard drives: technical data, health status, temperature, etc.

The IP address or the host name and the QTS port can be used to connect.
The SSL certificate check is suppressed so that the internal LAN IP address can be used even if a certificate is available (e.g. LetsEncrype with specification of a domain).
A NAS user is required for login. A separate user with restricted rights should be created for Homey. 