# wandip.github.io
Repo for my blog [dipakwani.com](dipakwani.com)
Created using Jekyll [Hyde](https://github.com/poole/hyde)

Because I keep forgetting how to start this server, and I hate the Hyde documentation - here we go!

So aparently, Hyde is built on top of Poole, which is built using Jekyll.
And somehow my system always has Jekyll missing.

```
❯ jekyll
zsh: command not found: jekyll
```

Brew to the rescue! LOVE BREW - So much that my first blog is about brew.
[Check it out!](https://dipakwani.com/2023/09/01/coffee/)

```
❯ brew install ruby
```

Wait, what? Why am I not installing jekyll?

So jekyll is a bundle that I can install using ruby gems.

So, half an hour later, here is the status.
I had to even upgrade my brew, then upgrade ruby, which allowed me to install jekyll.
Now jekyll was installed, but one of the gems, required a specific version on ruby, 3.1.2.

Too many keywords? Welcome to front end world! I hate it. Doesn't mean I won't work on it.
You don't always have to love what you do. Sometimes, its fine to hate it too.


Ok finally...
```
❯ bundle exec jekyll serve
Configuration file: /Users/dipak/Documents/wandip.github.io/_config.yml
To use retry middleware with Faraday v2.0+, install `faraday-retry` gem
   GitHub Metadata: No GitHub API authentication could be found. Some fields may be missing or have incorrect data.
            Source: /Users/dipak/Documents/wandip.github.io
       Destination: /Users/dipak/Documents/wandip.github.io/_site
 Incremental build: disabled. Enable with --incremental
      Generating...
                    done in 0.76 seconds.
 Auto-regeneration: enabled for '/Users/dipak/Documents/wandip.github.io'
    Server address: http://127.0.0.1:4000//
```
Beauty!

Well, why am I using this old framework as opposed to having a modern substack or something?

-> Why do you find your comfort food comfortable?

Update - May 26, 2025: I am crossposting to my blog on [Substack](https://dipakwani.substack.com).