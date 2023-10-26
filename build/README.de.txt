Verbinde Homey mit deinem QNAP NAS.
Du erhältst einen Überblick über wichtige Systemeigenschaften wie CPU- und Speicherauslastung, Temperatur, Lüfter, Firmwarestand.

Durch hinzufügen weiterer NAS-Elemete zu Homey werden folgende Daten bereitgestellt:
- Ethernet-Schnittstellen: IP-Daten, MAC, TX, RX, Fehler usw.
- Festplatten: technische Daten, Health-Status, Temperatur usw.

Zum Verbinden kann die IP-Adresse oder der Hostname sowie der QTS-Port verwendet werden.
Die SSL-Zertifikatsprüfung wird unterdrückt, so dass auch bei Vorhandensein eines Zertifikats (z.B: LetsEncrype mit Angabe einer Domain) die interne LAN-IP-Adresse verwendet werden kann.
Für die Anmeldung wird ein NAS-Benutzer benötigt. Es sollte ein separater Benutzer für Homey mit eingeschränkten Rechten angelegt werden.