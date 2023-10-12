<div style="text-align: center;">
    <img width="15%" src="logo.png"></img>
    <h1>ZombieNW's Dead Simple Count Server</h1>
</div>

![Language](https://badgen.net/badge/license/MIT/red) ![Language](https://badgen.net/badge/language/NodeJS/green)

A counting api HEAVILY enspired by [CountAPI](https://countapi.xyz/)



## This is stupid.
I agree, I wanted analytics on my site that was dead easy and not intrusive or slow, so I made this.

## Example
Fetching `http://url/count/namespace/key` will return a humble `{value: X}`, X being how many times that endpoint has been requested increased by 1.

Fetching `http://url/get/namespace/key` will return how many times that endpoint has been requested WITHOUT increasing it by 1.

Fetching `http://url/getnamespace/namespace` will return all the keys and values in that namespace. Example: `{"key":2,"key2":1}`

## Usage
Clone it, change your port if needed, added default.crt and default.key to /ssl/. And just do the old
You must add the https certificate/key for it to work. Please report any issues.
```
npm install
npm run start
```
And you're all good to go!