# SendPass

Securely* send passwords, URLs or other text data from any trusted computer with a camera (Phone, Laptop, Web Cam, etc.) to an un-trusted computer with ease.

* All data sent through SendPass is encrypted in your browser before being sent via the SendPass server. It should be noted however, that at this point SendPass relies on multiple third party libraries (see [package.json](package.json) for details), the security of which cannot be guaranteed.

## FAQ

### How do I use SendPass?

SendPass required two computers to access the SendPass server, a sending system and a receiving system. On the sending system enter the data you want to send in the provided input boxes and hit `Send`. In the subsequently displayed camera view locate the QR Code displayed by the receiving system. Once the QR code is successfully read the data will be transfered.

### Can the SendPass server see passwords I send with SendPass?

No, any data sent through SendPass is encrypted in your browser before being sent via the SnedPass server. The sever would only be able to see the encrypted data.

### Can I host my own SendPass server?

Absolutely! Fork this repository and build and run SendPass using Docker.

### What Web permissions does SendPass require, and what does it dow with them?

SendPass will request access to the following Web permissions:

* `Camera` (required) - SendPass needs to be able to access the camera of the system sending data. The camera is used to capture the QR Code displayed by the receiving system. No captured images are sent to or stored by SendPass. Audio is not recorded.
* `Clipboard` (*optional*) - SendPass may optionally requres access to the clipboard on the sending or receiving system in order to streamline the data transfer process. This permission is not required and may be denied if you'd prefer.