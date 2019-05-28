OWP Bot
=================

Some WIP Ideas for improving administration of OWP. Plus I like tinkering :)

Data is persisted to S3 as simple JSON files

# Commands

## !scorereport

### add / +
```
!scorereport add <team b short name> <team a wins>-<team b wins>-<draws> <team b short name>
```

Adds the score for a single match. Use team shortnames (no spaces). Including draw score is optional.
Returns a score record ID. 

```
!scorereport add TeamA 3-1-1 TeamB

Score added: cjw510wf300007lnsaqgb75mx
```

### delete / -
```
!scorereport del <score record id>
```

Deletes a score using the score record ID returned when the score was entered. `!scorereport show` will also list raw records including IDs

### show

```
!scorereport show
```

Debug method to show the raw score data 


### standings

```
!scorereport standings
```

Lists the standings, including map differential, and ordered by: match wins, then differential, then map wins.

Format looks like:

```css
Team      W     L     MW-ML-MD  Diff
AA        2     0     7  0  1   [+7]
CC        1     1     3  5  0   [-2]
BB        0     2     1  6  1   [-5]
```

## !teams

### add / +

```
!teams addteam <division> <short name> <long name>
```

Teams are required to add players. Division could be any name as long as there are no spaces. Teams must have also have a **unique** short name (no spaces). Short names are used to reference teams elsewhere in the api.

```
!teams addteam Upper AA Alpha Team
```

### addplayer

```
!teams addplayer <team short name> <nickname> <role> <discord tag> <battlenet tag> [<battlenet region> <battlenet platform>]
```

Adds a player to the team referenced by `<team short name>`. If the player's Overwatch profile is not private and has placed, the player's SR  will be fetched automatically. 

Battlenet Region defaults to `NA` and Battlenet platform defaults to `PC`

```
!teams addplayer AA guy Support guy#123 thatguy#54678
```

### roster

```
!teams roster <team short name>
```

Retrieves a team's full roster. Also calculates Average team SR and displays each player's SR.