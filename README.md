# Rainbow-dock-populator

Populator for [rainbow-dock](https://github.com/asbjornenge/rainbow-dns). It will query one or mulitple docker hosts and populate rainbow-dock with the results.

### RUN rainbow-dock-populator

	docker run asbjornenge/rainbow-dock-populator --dockerhost [] --apihost []

### Options

	--dockerhost     // Docker API URI
	--apihost        // Rainbow-dock API URI
	--ttl            // Time To Live for records

enjoy.