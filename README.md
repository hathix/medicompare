# Medicompare

> by Neel Mehta and Allison Kao

Helping patients compare care and price of medical procedures in their area

## Running

Ensure you have [Nodemon](https://github.com/remy/nodemon) installed, then run:

```
nodemon
```

Then visit <http://localhost:3000>.

# Screenshot

![Example search](public/img/example-medical-search.png)

# Example procedures to search

Procedure                                                         | Zip   | City         | Comments
----------------------------------------------------------------- | ----- | ------------ | ----------------------------------------------------------
069 - TRANSIENT ISCHEMIA                                          | 10010 | New York     | Shows suburb-city split
870 - SEPTICEMIA OR SEVERE SEPSIS W MV 96+ HOURS                  | 02110 | Boston       | Local example
853 - INFECTIOUS & PARASITIC DISEASES W O.R. PROCEDURE W MCC      | 10010 | New York     | More expensive version of Ischemia
178 - RESPIRATORY INFECTIONS & INFLAMMATIONS W CC                 | 82001 | Cheyenne, WY | More expensive & less choice in rural areas
207 - RESPIRATORY SYSTEM DIAGNOSIS W VENTILATOR SUPPORT 96+ HOURS | 95101 | San Jose     | Most expensive procedures, stark regional cost differences
