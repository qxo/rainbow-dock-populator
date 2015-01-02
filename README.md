# Rainbow-dock-populator

Populator for [rainbow-dock](https://github.com/asbjornenge/rainbow-dns). It will query one or mulitple docker hosts and populate rainbow-dock with the results.

### RUN rainbow-dock-populator

	docker run asbjornenge/rainbow-dock-populator --dockerhost 10.0.0.10:4243 --apihost 10.0.0.10:8080

### Options

	--dockerhost     // Docker API URI           (required)
	--apihost        // Rainbow-dock API URI     (required)
	--ttl            // Time To Live for records (default 300)
	--interval       // Query interval           (default 10)
	--logging        // Logging level quiet|loud (default quiet)

One can pass multiple *--dockerhost* arguments, but only a single *--apihost* (for now). Required format for both are <code>host:port</code>.

### Environment Variables

	DOCKER_CERT_CA    // Path to ca.pem
	DOCKER_CERT_CERT  // Path to cert.pem
	DOCKER_CERT_KEY   // Path to key.pem

None of the environment variables are required, but will be added to all docker hosts if present.

enjoy.