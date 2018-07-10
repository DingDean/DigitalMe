# DigitalMe

DigitalMe is an attempt to record and visualize my own digital footprint as much as possible.

It uses a set of applications to collect and visualize data:

* [Client-DigitalMe](https://github.com/DingDean/client-digitalme)
  - An application to collect code editing informations
  - It integrates with the following editor plugins:
    * [vim-digitme](https://github.com/DingDean/vim-digitme)
* [pwa-digitalme](https://github.com/DingDean/pwa-digitalme)
  - The front end pwa application to visualize the collected data

It collects your coding informations like filetype, coding speed, coding 
patterns. 

It can answer your questions like the followings:

- How often do you code?
- How fast do you code?
- When do you code often?
- What languages do you usually deal with?

Data collected would be processed and visualized properly through a web
 interface.

It's dynamic. When you type, the web interface would react
correspondingly with the behaviour that you can personalize.

Ultimately, it's a digitalization of myself.

## TODO

- [ ] gRPC Authentication
- [ ] HTTP JWT Authentication
- [ ] Cache Rewrite
- [ ] More functions without side-effect
- [ ] Better Unit Test
- [ ] Better Integrate Test
- [ ] CI/CD
- [ ] Better way to handle submodule
